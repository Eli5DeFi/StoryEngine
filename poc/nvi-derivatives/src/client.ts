/**
 * NVI Options Pool Client
 * 
 * TypeScript client for interacting with NVIOptionsPool smart contract
 */

import { ethers } from 'ethers';

export interface OptionDetails {
  id: bigint;
  chapterId: bigint;
  optionType: 0 | 1; // 0 = CALL, 1 = PUT
  strikeNVI: bigint;
  premium: bigint;
  expiry: bigint;
  creator: string;
  holder: string;
  collateral: bigint;
  settled: boolean;
  payout: bigint;
}

export interface NVISnapshot {
  chapterId: bigint;
  nviValue: bigint;
  timestamp: bigint;
  finalized: boolean;
}

export enum OptionType {
  CALL = 0,
  PUT = 1,
}

export class NVIOptionsClient {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  
  constructor(
    contractAddress: string,
    signer: ethers.Signer,
    abi: any[]
  ) {
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, abi, signer);
  }
  
  /**
   * Create a new NVI option (you become the option writer/creator)
   * 
   * @param chapterId - Chapter this option expires at
   * @param optionType - CALL or PUT
   * @param strikeNVI - Strike volatility (scaled by 100, e.g., 7000 = 70.00)
   * @param premium - Cost to buy option (in wei, e.g., ethers.parseUnits('5', 18) for 5 USDC)
   * @param expiry - Timestamp when option expires
   * @returns Transaction receipt
   * 
   * Example:
   * ```typescript
   * const tx = await client.createOption(
   *   100n,                              // Chapter 100
   *   OptionType.CALL,                   // Call option
   *   7000n,                             // Strike NVI = 70.00
   *   ethers.parseUnits('5', 18),        // Premium = 5 USDC
   *   BigInt(Date.now() / 1000) + 7n * 24n * 60n * 60n  // 7 days from now
   * );
   * ```
   */
  async createOption(
    chapterId: bigint,
    optionType: OptionType,
    strikeNVI: bigint,
    premium: bigint,
    expiry: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    // Approve collateral first (premium * 3 for max leverage)
    const maxCollateral = premium * 3n;
    const forgeToken = await this.contract.forgeToken();
    const tokenContract = new ethers.Contract(
      forgeToken,
      ['function approve(address,uint256) returns (bool)'],
      this.signer
    );
    
    await tokenContract.approve(await this.contract.getAddress(), maxCollateral);
    
    // Create option
    const tx = await this.contract.createOption(
      chapterId,
      optionType,
      strikeNVI,
      premium,
      expiry
    );
    
    return tx;
  }
  
  /**
   * Purchase an option (you become the option holder)
   * 
   * @param optionId - Option to purchase
   * @returns Transaction receipt
   * 
   * Example:
   * ```typescript
   * const tx = await client.purchaseOption(1n);
   * ```
   */
  async purchaseOption(optionId: bigint): Promise<ethers.ContractTransactionResponse> {
    // Get option details to know premium
    const option = await this.getOption(optionId);
    
    // Approve premium
    const forgeToken = await this.contract.forgeToken();
    const tokenContract = new ethers.Contract(
      forgeToken,
      ['function approve(address,uint256) returns (bool)'],
      this.signer
    );
    
    await tokenContract.approve(await this.contract.getAddress(), option.premium);
    
    // Purchase option
    const tx = await this.contract.purchaseOption(optionId);
    
    return tx;
  }
  
  /**
   * Settle an option after NVI is finalized
   * 
   * @param optionId - Option to settle
   * @returns Transaction receipt
   */
  async settleOption(optionId: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.settleOption(optionId);
  }
  
  /**
   * Get option details
   */
  async getOption(optionId: bigint): Promise<OptionDetails> {
    const option = await this.contract.getOption(optionId);
    
    return {
      id: option.id,
      chapterId: option.chapterId,
      optionType: option.optionType,
      strikeNVI: option.strikeNVI,
      premium: option.premium,
      expiry: option.expiry,
      creator: option.creator,
      holder: option.holder,
      collateral: option.collateral,
      settled: option.settled,
      payout: option.payout,
    };
  }
  
  /**
   * Get all options for a chapter
   */
  async getChapterOptions(chapterId: bigint): Promise<bigint[]> {
    return await this.contract.getChapterOptions(chapterId);
  }
  
  /**
   * Get NVI snapshot for a chapter
   */
  async getNVISnapshot(chapterId: bigint): Promise<NVISnapshot> {
    return await this.contract.getNVISnapshot(chapterId);
  }
  
  /**
   * Simulate option payout (before settlement)
   * 
   * @param optionId - Option to simulate
   * @param hypotheticalNVI - What-if NVI value (scaled by 100)
   * @returns Estimated payout
   * 
   * Example:
   * ```typescript
   * const payout = await client.simulatePayout(1n, 8000n); // If NVI hits 80.00
   * console.log('Estimated payout:', ethers.formatUnits(payout, 18), 'USDC');
   * ```
   */
  async simulatePayout(
    optionId: bigint,
    hypotheticalNVI: bigint
  ): Promise<bigint> {
    return await this.contract.simulatePayout(optionId, hypotheticalNVI);
  }
  
  /**
   * Calculate option profit/loss
   * 
   * @param option - Option details
   * @param finalNVI - Final NVI value
   * @returns Profit (positive) or loss (negative)
   */
  calculateProfitLoss(option: OptionDetails, finalNVI: bigint): bigint {
    if (option.optionType === OptionType.CALL) {
      // CALL: Profit if finalNVI > strikeNVI
      if (finalNVI > option.strikeNVI) {
        const diff = finalNVI - option.strikeNVI;
        const profit = (diff * option.premium) / 100n;
        return profit;
      }
      // Loss = premium paid
      return -option.premium;
    } else {
      // PUT: Profit if finalNVI < strikeNVI
      if (finalNVI < option.strikeNVI) {
        const diff = option.strikeNVI - finalNVI;
        const profit = (diff * option.premium) / 100n;
        return profit;
      }
      // Loss = premium paid
      return -option.premium;
    }
  }
  
  /**
   * Get option Greeks (Delta, Gamma, Theta, Vega)
   * 
   * Simplified Black-Scholes approximation for narrative options
   * 
   * Note: This is a POC implementation. Production would use more sophisticated models.
   */
  calculateGreeks(option: OptionDetails, currentNVI: bigint): {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  } {
    const S = Number(currentNVI) / 100; // Current NVI (normalized)
    const K = Number(option.strikeNVI) / 100; // Strike NVI (normalized)
    const T = Number(option.expiry - BigInt(Math.floor(Date.now() / 1000))) / (365 * 24 * 60 * 60); // Time to expiry (years)
    
    // Simplified Greeks (not exact Black-Scholes)
    const moneyness = S / K;
    
    const delta = option.optionType === OptionType.CALL
      ? Math.min(1, Math.max(0, moneyness))
      : Math.min(1, Math.max(0, 1 - moneyness));
    
    const gamma = 0.1; // Simplified
    const theta = -0.01; // Time decay
    const vega = 0.2; // Volatility sensitivity
    
    return { delta, gamma, theta, vega };
  }
  
  /**
   * Get option status
   */
  getOptionStatus(option: OptionDetails, currentTimestamp?: bigint): {
    status: 'unsold' | 'active' | 'expired' | 'settled';
    description: string;
  } {
    const now = currentTimestamp || BigInt(Math.floor(Date.now() / 1000));
    
    if (option.settled) {
      return {
        status: 'settled',
        description: `Settled with payout: ${ethers.formatUnits(option.payout, 18)} USDC`,
      };
    }
    
    if (now >= option.expiry) {
      return {
        status: 'expired',
        description: 'Option expired (not settled yet)',
      };
    }
    
    if (option.holder === ethers.ZeroAddress) {
      return {
        status: 'unsold',
        description: 'Option available for purchase',
      };
    }
    
    return {
      status: 'active',
      description: `Active option held by ${option.holder.slice(0, 6)}...${option.holder.slice(-4)}`,
    };
  }
  
  /**
   * Format option for display
   */
  formatOption(option: OptionDetails): string {
    const type = option.optionType === OptionType.CALL ? 'CALL' : 'PUT';
    const strike = Number(option.strikeNVI) / 100;
    const premium = ethers.formatUnits(option.premium, 18);
    const expiry = new Date(Number(option.expiry) * 1000).toLocaleDateString();
    
    return `${type} Option | Strike: ${strike} | Premium: ${premium} USDC | Expires: ${expiry}`;
  }
  
  /**
   * Listen to option events
   */
  onOptionCreated(
    callback: (optionId: bigint, chapterId: bigint, creator: string) => void
  ): void {
    this.contract.on('OptionCreated', (optionId, chapterId, optionType, strikeNVI, premium, creator) => {
      callback(optionId, chapterId, creator);
    });
  }
  
  onOptionPurchased(
    callback: (optionId: bigint, buyer: string, premium: bigint) => void
  ): void {
    this.contract.on('OptionPurchased', (optionId, buyer, premium) => {
      callback(optionId, buyer, premium);
    });
  }
  
  onOptionSettled(
    callback: (optionId: bigint, finalNVI: bigint, payout: bigint, winner: string) => void
  ): void {
    this.contract.on('OptionSettled', (optionId, finalNVI, payout, winner) => {
      callback(optionId, finalNVI, payout, winner);
    });
  }
  
  onNVIFinalized(
    callback: (chapterId: bigint, nviValue: bigint) => void
  ): void {
    this.contract.on('NVIFinalized', (chapterId, nviValue) => {
      callback(chapterId, nviValue);
    });
  }
}

/**
 * Example usage
 */
export async function exampleUsage() {
  // Setup (you would use your own provider/signer)
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signer = await provider.getSigner();
  
  const contractAddress = '0x...'; // Deployed contract address
  const abi = []; // Contract ABI
  
  const client = new NVIOptionsClient(contractAddress, signer, abi);
  
  // Create a CALL option
  console.log('Creating CALL option...');
  const createTx = await client.createOption(
    100n,                                      // Chapter 100
    OptionType.CALL,                           // Call option
    7000n,                                     // Strike NVI = 70.00
    ethers.parseUnits('5', 18),                // Premium = 5 USDC
    BigInt(Math.floor(Date.now() / 1000)) + 7n * 24n * 60n * 60n  // 7 days
  );
  await createTx.wait();
  console.log('Option created!');
  
  // Get option details
  const option = await client.getOption(1n);
  console.log('Option details:', client.formatOption(option));
  
  // Simulate payout
  const payout = await client.simulatePayout(1n, 8000n); // If NVI hits 80.00
  console.log('Estimated payout:', ethers.formatUnits(payout, 18), 'USDC');
  
  // Calculate profit/loss
  const profitLoss = client.calculateProfitLoss(option, 8000n);
  console.log('Profit/Loss:', ethers.formatUnits(profitLoss, 18), 'USDC');
  
  // Get Greeks
  const greeks = client.calculateGreeks(option, 7500n); // Current NVI = 75.00
  console.log('Greeks:', greeks);
  
  // Listen to events
  client.onOptionCreated((optionId, chapterId, creator) => {
    console.log(`New option created: ${optionId} for chapter ${chapterId} by ${creator}`);
  });
  
  client.onNVIFinalized((chapterId, nviValue) => {
    console.log(`NVI finalized for chapter ${chapterId}: ${Number(nviValue) / 100}`);
  });
}
