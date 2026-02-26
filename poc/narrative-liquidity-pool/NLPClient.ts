/**
 * Narrative Liquidity Pool (NLP) TypeScript Client
 * 
 * SDK for interacting with NarrativeLiquidityPool smart contract
 * 
 * @author Voidborne Team (Innovation Cycle #46)
 */

import { ethers, Contract, BigNumber } from 'ethers';

// ABI (minimal, for POC - full ABI would be auto-generated)
const NLP_ABI = [
  "function addLiquidity(uint256 chapterId, uint256 outcomeId, uint256 amount) external returns (uint256)",
  "function removeLiquidity(uint256 chapterId, uint256 outcomeId, uint256 lpTokens) external returns (uint256)",
  "function swapPosition(uint256 chapterId, uint256 fromOutcome, uint256 toOutcome, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
  "function resolveChapter(uint256 chapterId, uint256 winningOutcome) external",
  "function claimWinnings(uint256 chapterId) external returns (uint256)",
  "function getPrice(uint256 chapterId, uint256 fromOutcome, uint256 toOutcome) external view returns (uint256)",
  "function getAmountOut(uint256 chapterId, uint256 fromOutcome, uint256 toOutcome, uint256 amountIn) external view returns (uint256)",
  "function getUserLPBalance(uint256 chapterId, uint256 outcomeId, address user) external view returns (uint256)",
  "function getPoolReserves(uint256 chapterId, uint256 numOutcomes) external view returns (uint256[])",
  "function liquidity(uint256 chapterId, uint256 outcomeId) external view returns (uint256)",
  "function lpTotalSupply(uint256 chapterId, uint256 outcomeId) external view returns (uint256)",
  "function bettingDeadline(uint256 chapterId) external view returns (uint256)",
  "function chapterResolved(uint256 chapterId) external view returns (bool)",
  "function winningOutcome(uint256 chapterId) external view returns (uint256)",
];

export interface PoolState {
  chapterId: number;
  numOutcomes: number;
  reserves: string[]; // USDC amounts (6 decimals)
  totalSupplies: string[]; // LP token supplies
  bettingDeadline: number; // Unix timestamp
  resolved: boolean;
  winningOutcome?: number;
}

export interface SwapQuote {
  fromOutcome: number;
  toOutcome: number;
  amountIn: string;
  amountOut: string;
  price: string; // Exchange rate (18 decimals)
  priceImpact: string; // Percentage (2 decimals, e.g., "2.34")
  fee: string; // USDC (6 decimals)
}

export interface LiquidityPosition {
  chapterId: number;
  outcomeId: number;
  lpBalance: string; // LP tokens owned
  shareOfPool: string; // Percentage (2 decimals)
  valueUSDC: string; // Estimated USDC value
}

export class NarrativeLiquidityPoolClient {
  private contract: Contract;
  private signer: ethers.Signer;
  private provider: ethers.providers.Provider;

  constructor(
    contractAddress: string,
    signerOrProvider: ethers.Signer | ethers.providers.Provider
  ) {
    this.provider = 
      'getAddress' in signerOrProvider 
        ? (signerOrProvider as ethers.Signer).provider! 
        : signerOrProvider as ethers.providers.Provider;
    
    this.signer = 'getAddress' in signerOrProvider 
      ? signerOrProvider as ethers.Signer 
      : (signerOrProvider as ethers.providers.Provider).getSigner();

    this.contract = new Contract(contractAddress, NLP_ABI, this.signer);
  }

  // ============ CORE FUNCTIONS ============

  /**
   * Add liquidity to an outcome pool
   * @param chapterId Chapter ID
   * @param outcomeId Outcome ID (0, 1, 2, etc.)
   * @param amountUSDC Amount of USDC to add (in USDC units, e.g., 100.50 → "100.5")
   * @returns Transaction receipt
   */
  async addLiquidity(
    chapterId: number,
    outcomeId: number,
    amountUSDC: string
  ): Promise<ethers.ContractReceipt> {
    const amount = ethers.utils.parseUnits(amountUSDC, 6); // USDC has 6 decimals
    const tx = await this.contract.addLiquidity(chapterId, outcomeId, amount);
    return await tx.wait();
  }

  /**
   * Remove liquidity from an outcome pool
   * @param chapterId Chapter ID
   * @param outcomeId Outcome ID
   * @param lpTokens Amount of LP tokens to burn (in wei, e.g., "1.5" → 1.5e18)
   * @returns Transaction receipt
   */
  async removeLiquidity(
    chapterId: number,
    outcomeId: number,
    lpTokens: string
  ): Promise<ethers.ContractReceipt> {
    const tokens = ethers.utils.parseEther(lpTokens);
    const tx = await this.contract.removeLiquidity(chapterId, outcomeId, tokens);
    return await tx.wait();
  }

  /**
   * Swap position from one outcome to another
   * @param chapterId Chapter ID
   * @param fromOutcome Outcome ID to swap from
   * @param toOutcome Outcome ID to swap to
   * @param amountIn Amount to swap (LP tokens, in wei)
   * @param slippageTolerance Slippage tolerance (0.5 = 0.5%)
   * @returns Transaction receipt
   */
  async swapPosition(
    chapterId: number,
    fromOutcome: number,
    toOutcome: number,
    amountIn: string,
    slippageTolerance: number = 0.5
  ): Promise<ethers.ContractReceipt> {
    const amountInWei = ethers.utils.parseEther(amountIn);
    
    // Get expected output
    const quote = await this.getSwapQuote(chapterId, fromOutcome, toOutcome, amountIn);
    
    // Calculate minimum output (slippage protection)
    const minAmountOut = ethers.utils.parseEther(quote.amountOut)
      .mul(10000 - slippageTolerance * 100)
      .div(10000);

    const tx = await this.contract.swapPosition(
      chapterId,
      fromOutcome,
      toOutcome,
      amountInWei,
      minAmountOut
    );
    return await tx.wait();
  }

  /**
   * Claim winnings after chapter resolution
   * @param chapterId Chapter ID
   * @returns Transaction receipt
   */
  async claimWinnings(chapterId: number): Promise<ethers.ContractReceipt> {
    const tx = await this.contract.claimWinnings(chapterId);
    return await tx.wait();
  }

  // ============ VIEW FUNCTIONS ============

  /**
   * Get complete pool state
   * @param chapterId Chapter ID
   * @param numOutcomes Number of outcomes (2, 3, 4, etc.)
   * @returns Pool state object
   */
  async getPoolState(chapterId: number, numOutcomes: number): Promise<PoolState> {
    const [reserves, deadline, resolved] = await Promise.all([
      this.contract.getPoolReserves(chapterId, numOutcomes),
      this.contract.bettingDeadline(chapterId),
      this.contract.chapterResolved(chapterId)
    ]);

    // Get total supplies for each outcome
    const totalSupplies: string[] = [];
    for (let i = 0; i < numOutcomes; i++) {
      const supply = await this.contract.lpTotalSupply(chapterId, i);
      totalSupplies.push(ethers.utils.formatEther(supply));
    }

    const state: PoolState = {
      chapterId,
      numOutcomes,
      reserves: reserves.map((r: BigNumber) => ethers.utils.formatUnits(r, 6)),
      totalSupplies,
      bettingDeadline: deadline.toNumber(),
      resolved
    };

    if (resolved) {
      state.winningOutcome = (await this.contract.winningOutcome(chapterId)).toNumber();
    }

    return state;
  }

  /**
   * Get swap quote (expected output for given input)
   * @param chapterId Chapter ID
   * @param fromOutcome From outcome ID
   * @param toOutcome To outcome ID
   * @param amountIn Amount to swap (LP tokens, in ether units)
   * @returns Swap quote object
   */
  async getSwapQuote(
    chapterId: number,
    fromOutcome: number,
    toOutcome: number,
    amountIn: string
  ): Promise<SwapQuote> {
    const amountInWei = ethers.utils.parseEther(amountIn);
    
    const [amountOutWei, price, reserveFrom, reserveTo] = await Promise.all([
      this.contract.getAmountOut(chapterId, fromOutcome, toOutcome, amountInWei),
      this.contract.getPrice(chapterId, fromOutcome, toOutcome),
      this.contract.liquidity(chapterId, fromOutcome),
      this.contract.liquidity(chapterId, toOutcome)
    ]);

    const amountOut = ethers.utils.formatEther(amountOutWei);
    
    // Calculate price impact
    // Price impact = (amountIn / reserveFrom) * 100
    const priceImpact = amountInWei
      .mul(10000)
      .div(reserveFrom)
      .toNumber() / 100;

    // Calculate fee (0.3%)
    const fee = ethers.utils.formatUnits(
      amountInWei.mul(30).div(10000),
      6 // USDC decimals
    );

    return {
      fromOutcome,
      toOutcome,
      amountIn,
      amountOut,
      price: ethers.utils.formatEther(price),
      priceImpact: priceImpact.toFixed(2),
      fee
    };
  }

  /**
   * Get user's liquidity positions
   * @param chapterId Chapter ID
   * @param numOutcomes Number of outcomes
   * @param userAddress User address (optional, defaults to signer)
   * @returns Array of liquidity positions
   */
  async getUserPositions(
    chapterId: number,
    numOutcomes: number,
    userAddress?: string
  ): Promise<LiquidityPosition[]> {
    const user = userAddress || await this.signer.getAddress();
    const positions: LiquidityPosition[] = [];

    for (let i = 0; i < numOutcomes; i++) {
      const [lpBalance, totalSupply, liquidity] = await Promise.all([
        this.contract.getUserLPBalance(chapterId, i, user),
        this.contract.lpTotalSupply(chapterId, i),
        this.contract.liquidity(chapterId, i)
      ]);

      if (lpBalance.gt(0)) {
        const shareOfPool = lpBalance.mul(10000).div(totalSupply).toNumber() / 100;
        const valueUSDC = liquidity.mul(lpBalance).div(totalSupply);

        positions.push({
          chapterId,
          outcomeId: i,
          lpBalance: ethers.utils.formatEther(lpBalance),
          shareOfPool: shareOfPool.toFixed(2),
          valueUSDC: ethers.utils.formatUnits(valueUSDC, 6)
        });
      }
    }

    return positions;
  }

  /**
   * Get current prices for all outcome pairs
   * @param chapterId Chapter ID
   * @param numOutcomes Number of outcomes
   * @returns Price matrix (2D array)
   */
  async getPriceMatrix(
    chapterId: number,
    numOutcomes: number
  ): Promise<string[][]> {
    const matrix: string[][] = [];

    for (let i = 0; i < numOutcomes; i++) {
      matrix[i] = [];
      for (let j = 0; j < numOutcomes; j++) {
        if (i === j) {
          matrix[i][j] = "1.0"; // Same outcome = 1:1
        } else {
          const price = await this.contract.getPrice(chapterId, i, j);
          matrix[i][j] = ethers.utils.formatEther(price);
        }
      }
    }

    return matrix;
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check if betting is still open
   * @param chapterId Chapter ID
   * @returns True if betting is open
   */
  async isBettingOpen(chapterId: number): Promise<boolean> {
    const deadline = await this.contract.bettingDeadline(chapterId);
    const now = Math.floor(Date.now() / 1000);
    return deadline.toNumber() > now;
  }

  /**
   * Get time remaining until betting closes
   * @param chapterId Chapter ID
   * @returns Seconds remaining (0 if closed)
   */
  async getTimeRemaining(chapterId: number): Promise<number> {
    const deadline = await this.contract.bettingDeadline(chapterId);
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, deadline.toNumber() - now);
  }

  /**
   * Format time remaining as human-readable string
   * @param seconds Seconds
   * @returns Formatted string (e.g., "2h 34m")
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds === 0) return "Closed";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Calculate optimal swap route (for future multi-hop swaps)
   * @param chapterId Chapter ID
   * @param fromOutcome From outcome
   * @param toOutcome To outcome
   * @param amountIn Amount to swap
   * @returns Best route (currently direct only, future: multi-hop)
   */
  async getOptimalRoute(
    chapterId: number,
    fromOutcome: number,
    toOutcome: number,
    amountIn: string
  ): Promise<SwapQuote> {
    // For POC, only direct swaps
    // Future: implement multi-hop routing (A → B → C)
    return await this.getSwapQuote(chapterId, fromOutcome, toOutcome, amountIn);
  }
}

// ============ EXAMPLE USAGE ============

/**
 * Example: Adding liquidity
 */
export async function exampleAddLiquidity() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = provider.getSigner();
  const nlp = new NarrativeLiquidityPoolClient("0x...", signer);

  // Add 100 USDC to Outcome 0 of Chapter 15
  const receipt = await nlp.addLiquidity(15, 0, "100");
  console.log("Liquidity added:", receipt.transactionHash);
}

/**
 * Example: Swapping positions
 */
export async function exampleSwapPosition() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = provider.getSigner();
  const nlp = new NarrativeLiquidityPoolClient("0x...", signer);

  // Get quote first
  const quote = await nlp.getSwapQuote(15, 0, 1, "50");
  console.log("Quote:", quote);
  console.log(`Swap 50 LP tokens: ${quote.amountIn} → ${quote.amountOut} (fee: ${quote.fee} USDC)`);
  console.log(`Price impact: ${quote.priceImpact}%`);

  // Execute swap with 0.5% slippage tolerance
  const receipt = await nlp.swapPosition(15, 0, 1, "50", 0.5);
  console.log("Swap executed:", receipt.transactionHash);
}

/**
 * Example: Viewing pool state
 */
export async function examplePoolState() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const nlp = new NarrativeLiquidityPoolClient("0x...", provider);

  // Get state for Chapter 15 (3 outcomes)
  const state = await nlp.getPoolState(15, 3);
  console.log("Pool State:");
  console.log("- Reserves:", state.reserves);
  console.log("- LP Supplies:", state.totalSupplies);
  console.log("- Betting closes in:", nlp.formatTimeRemaining(
    state.bettingDeadline - Math.floor(Date.now() / 1000)
  ));

  // Get price matrix
  const prices = await nlp.getPriceMatrix(15, 3);
  console.log("\nPrice Matrix:");
  console.log(prices);
}

export default NarrativeLiquidityPoolClient;
