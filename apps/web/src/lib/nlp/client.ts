/**
 * Narrative Liquidity Pool (NLP) Client
 * 
 * TypeScript client for interacting with the NLP smart contract.
 * Provides methods for swapping positions, adding/removing liquidity,
 * and viewing pool state.
 * 
 * @author Voidborne Team (Innovation Cycle #46)
 * @version 1.0.0
 */

import { ethers } from 'ethers';
import type { Signer } from 'ethers';
import NLPAbi from './abi.json';

// ============ TYPES ============

export interface PoolState {
  chapterId: number;
  numOutcomes: number;
  reserves: string[]; // USDC amounts
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
  price: string; // Exchange rate
  priceImpact: string; // Percentage
  fee: string; // USDC
}

export interface LiquidityPosition {
  chapterId: number;
  outcomeId: number;
  lpBalance: string; // LP tokens owned
  shareOfPool: string; // Percentage
  valueUSDC: string; // Estimated value
}

// ============ CLIENT ============

export class NarrativeLiquidityPoolClient {
  private contract: ethers.Contract;
  private signer?: Signer;

  constructor(
    contractAddress: string,
    signerOrProvider: Signer | ethers.providers.Provider
  ) {
    this.contract = new ethers.Contract(
      contractAddress,
      NLPAbi,
      signerOrProvider
    );

    if ('getAddress' in signerOrProvider) {
      this.signer = signerOrProvider as Signer;
    }
  }

  // ============ CORE FUNCTIONS ============

  /**
   * Add liquidity to an outcome pool
   * @param chapterId Chapter ID
   * @param outcomeId Outcome ID (0, 1, 2, etc.)
   * @param amountUSDC Amount of USDC to add (in full units, not wei)
   * @returns Transaction receipt
   */
  async addLiquidity(
    chapterId: number,
    outcomeId: number,
    amountUSDC: string
  ): Promise<ethers.ContractReceipt> {
    if (!this.signer) throw new Error('NLP: Signer required for write operations');

    const amount = ethers.utils.parseUnits(amountUSDC, 6); // USDC = 6 decimals
    const tx = await this.contract.connect(this.signer).addLiquidity(
      chapterId,
      outcomeId,
      amount
    );

    return await tx.wait();
  }

  /**
   * Remove liquidity from an outcome pool
   * @param chapterId Chapter ID
   * @param outcomeId Outcome ID
   * @param lpTokens Amount of LP tokens to burn (in full units, not wei)
   * @returns Transaction receipt
   */
  async removeLiquidity(
    chapterId: number,
    outcomeId: number,
    lpTokens: string
  ): Promise<ethers.ContractReceipt> {
    if (!this.signer) throw new Error('NLP: Signer required for write operations');

    const amount = ethers.utils.parseEther(lpTokens); // LP tokens = 18 decimals
    const tx = await this.contract.connect(this.signer).removeLiquidity(
      chapterId,
      outcomeId,
      amount
    );

    return await tx.wait();
  }

  /**
   * Swap position from one outcome to another
   * @param chapterId Chapter ID
   * @param fromOutcome Outcome to swap from
   * @param toOutcome Outcome to swap to
   * @param amountIn Amount to swap (in LP tokens, full units)
   * @param slippageTolerance Slippage tolerance (0.5 = 0.5%)
   * @returns Transaction receipt
   */
  async swapPosition(
    chapterId: number,
    fromOutcome: number,
    toOutcome: number,
    amountIn: string,
    slippageTolerance: number = 0.5 // Default 0.5%
  ): Promise<ethers.ContractReceipt> {
    if (!this.signer) throw new Error('NLP: Signer required for write operations');

    // Get quote to calculate minAmountOut
    const quote = await this.getSwapQuote(chapterId, fromOutcome, toOutcome, amountIn);
    const minAmountOut = ethers.BigNumber.from(quote.amountOut)
      .mul(10000 - Math.floor(slippageTolerance * 100))
      .div(10000);

    const amount = ethers.utils.parseEther(amountIn);
    const tx = await this.contract.connect(this.signer).swapPosition(
      chapterId,
      fromOutcome,
      toOutcome,
      amount,
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
    if (!this.signer) throw new Error('NLP: Signer required for write operations');

    const tx = await this.contract.connect(this.signer).claimWinnings(chapterId);
    return await tx.wait();
  }

  // ============ VIEW FUNCTIONS ============

  /**
   * Get complete pool state for a chapter
   * @param chapterId Chapter ID
   * @param numOutcomes Number of outcomes
   * @returns Pool state object
   */
  async getPoolState(chapterId: number, numOutcomes: number): Promise<PoolState> {
    const [reserves, resolved, winningOutcome, deadline] = await Promise.all([
      this.contract.getPoolReserves(chapterId, numOutcomes),
      this.contract.chapterResolved(chapterId),
      this.contract.winningOutcome(chapterId).catch(() => undefined),
      this.contract.bettingDeadline(chapterId),
    ]);

    const totalSupplies = await Promise.all(
      Array.from({ length: numOutcomes }, (_, i) =>
        this.contract.lpTotalSupply(chapterId, i)
      )
    );

    return {
      chapterId,
      numOutcomes,
      reserves: reserves.map((r: ethers.BigNumber) => ethers.utils.formatUnits(r, 6)),
      totalSupplies: totalSupplies.map((s: ethers.BigNumber) => ethers.utils.formatEther(s)),
      bettingDeadline: deadline.toNumber(),
      resolved,
      winningOutcome: resolved ? winningOutcome.toNumber() : undefined,
    };
  }

  /**
   * Get swap quote (expected output for a given input)
   * @param chapterId Chapter ID
   * @param fromOutcome Outcome to swap from
   * @param toOutcome Outcome to swap to
   * @param amountIn Amount to swap (in LP tokens, full units)
   * @returns Swap quote object
   */
  async getSwapQuote(
    chapterId: number,
    fromOutcome: number,
    toOutcome: number,
    amountIn: string
  ): Promise<SwapQuote> {
    const amount = ethers.utils.parseEther(amountIn);
    const amountOut = await this.contract.getAmountOut(
      chapterId,
      fromOutcome,
      toOutcome,
      amount
    );

    const price = await this.contract.getPrice(chapterId, fromOutcome, toOutcome);

    // Calculate fee (0.3%)
    const fee = amount.mul(30).div(10000); // 0.3% = 30/10000

    // Calculate price impact
    const reserveFrom = await this.contract.liquidity(chapterId, fromOutcome);
    const priceImpact = amount.mul(10000).div(reserveFrom); // Percentage * 100

    return {
      fromOutcome,
      toOutcome,
      amountIn,
      amountOut: ethers.utils.formatEther(amountOut),
      price: ethers.utils.formatEther(price),
      priceImpact: (priceImpact.toNumber() / 100).toFixed(2),
      fee: ethers.utils.formatEther(fee),
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
    const address = userAddress || (await this.signer?.getAddress());
    if (!address) throw new Error('NLP: User address required');

    const positions: LiquidityPosition[] = [];

    for (let i = 0; i < numOutcomes; i++) {
      const [lpBalance, totalSupply, reserve] = await Promise.all([
        this.contract.getUserLPBalance(chapterId, i, address),
        this.contract.lpTotalSupply(chapterId, i),
        this.contract.liquidity(chapterId, i),
      ]);

      if (lpBalance.gt(0)) {
        const shareOfPool = totalSupply.gt(0)
          ? lpBalance.mul(10000).div(totalSupply).toNumber() / 100
          : 0;

        const valueUSDC = totalSupply.gt(0)
          ? reserve.mul(lpBalance).div(totalSupply)
          : ethers.BigNumber.from(0);

        positions.push({
          chapterId,
          outcomeId: i,
          lpBalance: ethers.utils.formatEther(lpBalance),
          shareOfPool: shareOfPool.toFixed(2),
          valueUSDC: ethers.utils.formatUnits(valueUSDC, 6),
        });
      }
    }

    return positions;
  }

  /**
   * Check if betting is still open
   * @param chapterId Chapter ID
   * @returns True if betting is open
   */
  async isBettingOpen(chapterId: number): Promise<boolean> {
    const deadline = await this.contract.bettingDeadline(chapterId);
    return deadline.toNumber() > Math.floor(Date.now() / 1000);
  }

  /**
   * Get time remaining until betting closes
   * @param chapterId Chapter ID
   * @returns Seconds remaining
   */
  async getTimeRemaining(chapterId: number): Promise<number> {
    const deadline = await this.contract.bettingDeadline(chapterId);
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, deadline.toNumber() - now);
  }

  /**
   * Format time remaining as human-readable string
   * @param seconds Seconds remaining
   * @returns Formatted string (e.g., "2h 34m")
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'Betting closed';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  /**
   * Get price matrix for all outcome pairs
   * @param chapterId Chapter ID
   * @param numOutcomes Number of outcomes
   * @returns 2D array of prices
   */
  async getPriceMatrix(chapterId: number, numOutcomes: number): Promise<string[][]> {
    const matrix: string[][] = Array.from({ length: numOutcomes }, () =>
      Array(numOutcomes).fill('0')
    );

    for (let i = 0; i < numOutcomes; i++) {
      for (let j = 0; j < numOutcomes; j++) {
        if (i !== j) {
          const price = await this.contract.getPrice(chapterId, i, j);
          matrix[i][j] = ethers.utils.formatEther(price);
        }
      }
    }

    return matrix;
  }
}
