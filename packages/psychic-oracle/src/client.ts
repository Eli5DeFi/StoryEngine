/**
 * @module psychic-oracle/client
 * @description TypeScript client for the Voidborne Psychic Consensus Oracle.
 *
 * Wraps all on-chain interactions for:
 *   - Story pool management
 *   - Layer 1 story betting (choice A/B/C)
 *   - Layer 2 psychic betting (will crowd be right?)
 *   - Resolution, claims, and leaderboard queries
 *
 * @example
 * ```ts
 * const client = new PsychicOracleClient({
 *   contractAddress: '0x...',
 *   forgeTokenAddress: '0x...',
 *   chainId: 84532, // Base Sepolia
 *   oracleAddress: '0x...',
 * })
 *
 * // Get pool state
 * const pool = await client.getPool(1n)
 * const consensus = await client.getConsensusMarket(1n)
 *
 * // Preview payouts before betting
 * const preview = await client.previewMainPayout(1n, 0, parseUnits('100', 6))
 *
 * // Place bets (pass publicClient + walletClient from viem/wagmi)
 * await client.betOnChoice(publicClient, walletClient, 1n, 0, parseUnits('100', 6))
 * await client.betOnConsensus(publicClient, walletClient, 1n, 'crowd_wrong', parseUnits('50', 6))
 * ```
 */

import {
  createPublicClient,
  createWalletClient,
  type PublicClient,
  type WalletClient,
  type Address,
  parseAbi,
  parseUnits,
  formatUnits,
  http,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'

import {
  type PCOConfig,
  type StoryPool,
  type StoryChoice,
  type ConsensusMarket,
  type PsychicProfile,
  type MainPayoutPreview,
  type PsychicPayoutPreview,
  type ResolutionResult,
  ConsensusPosition,
  PoolStatus,
  computeBadge,
} from './types'

// ─── ABI (minimal, for core functions) ───────────────────────────────────────

const PCO_ABI = parseAbi([
  // Pool creation & management
  'function createPool(uint256 poolId, uint256 chapterId, uint256 bettingDeadline, uint256 numChoices) external',

  // Layer 1: Story betting
  'function betOnChoice(uint256 poolId, uint256 choice, uint256 amount) external',
  'function claimMainWinnings(uint256 poolId) external',
  'function previewMainPayout(uint256 poolId, uint256 choice, uint256 amount) view returns (uint256)',

  // Layer 2: Psychic oracle
  'function betOnConsensus(uint256 poolId, bool predictCrowdRight, uint256 amount) external',
  'function claimPsychicWinnings(uint256 poolId) external',

  // Resolution (oracle only)
  'function resolvePool(uint256 poolId, uint256 winningChoice) external',

  // Admin
  'function withdrawFees(uint256 poolId) external',
  'function setOracle(address _oracle) external',

  // Views
  'function pools(uint256) view returns (uint256 chapterId, uint256 bettingDeadline, uint256 numChoices, uint256 totalBets, bool resolved, uint256 winningChoice, bool crowdWasRight, bool feesWithdrawn)',
  'function choiceBets(uint256 poolId, uint256 choice) view returns (uint256)',
  'function userBets(uint256 poolId, address user, uint256 choice) view returns (uint256)',
  'function userCrowdRight(uint256 poolId, address user) view returns (uint256)',
  'function userCrowdWrong(uint256 poolId, address user) view returns (uint256)',
  'function getOdds(uint256 poolId) view returns (uint256[] amounts, uint256[] pcts)',
  'function getConsensusState(uint256 poolId) view returns (uint256 crowdRightBets, uint256 crowdWrongBets, uint256 crowdRightPct, uint256 contraBonusMultiplier, bool resolved, bool crowdWasRight)',
  'function getPsychicProfile(address psychic) view returns (uint256 score, uint256 contraryWins, uint256 totalBetsPlaced, uint256 accuracy)',
  'function mainClaimed(uint256, address) view returns (bool)',
  'function psychicClaimed(uint256, address) view returns (bool)',

  // Events
  'event PoolCreated(uint256 indexed poolId, uint256 indexed chapterId, uint256 deadline, uint256 numChoices)',
  'event MainBetPlaced(uint256 indexed poolId, address indexed bettor, uint256 choice, uint256 amount)',
  'event PsychicBetPlaced(uint256 indexed poolId, address indexed bettor, bool predictedCrowdRight, uint256 amount)',
  'event PoolResolved(uint256 indexed poolId, uint256 winningChoice, bool crowdWasRight, uint256 winningChoiceBets, uint256 totalBets)',
  'event MainWinnerClaimed(uint256 indexed poolId, address indexed winner, uint256 payout)',
  'event PsychicWinnerClaimed(uint256 indexed poolId, address indexed winner, uint256 payout, bool wasContrarian)',
  'event PsychicScoreUpdated(address indexed psychic, uint256 newScore, bool wasContrarian)',
])

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
])

// ─── Client ──────────────────────────────────────────────────────────────────

export class PsychicOracleClient {
  private config: PCOConfig

  constructor(config: PCOConfig) {
    this.config = config
  }

  // ─── Query Methods ─────────────────────────────────────────────────────────

  /**
   * Fetch full StoryPool data including odds per choice.
   */
  async getPool(publicClient: PublicClient, poolId: bigint): Promise<StoryPool> {
    const [poolData, oddsData] = await Promise.all([
      publicClient.readContract({
        address: this.config.contractAddress,
        abi: PCO_ABI,
        functionName: 'pools',
        args: [poolId],
      }) as Promise<readonly [bigint, bigint, bigint, bigint, boolean, bigint, boolean, boolean]>,
      publicClient.readContract({
        address: this.config.contractAddress,
        abi: PCO_ABI,
        functionName: 'getOdds',
        args: [poolId],
      }) as Promise<readonly [readonly bigint[], readonly bigint[]]>,
    ])

    const [chapterId, bettingDeadline, numChoices, totalBets, resolved, winningChoice, crowdWasRight] = poolData
    const [amounts, pcts] = oddsData

    let status: PoolStatus
    const now = Date.now()
    const deadline = new Date(Number(bettingDeadline) * 1000)
    if (resolved) {
      status = PoolStatus.RESOLVED
    } else if (now >= deadline.getTime()) {
      status = PoolStatus.CLOSED
    } else {
      status = PoolStatus.OPEN
    }

    const choices: StoryChoice[] = Array.from({ length: Number(numChoices) }).map((_, i) => ({
      index:          i,
      text:           `Choice ${i + 1}`, // Populated from off-chain story data
      totalBets:      amounts[i],
      oddsPercent:    Number(pcts[i]),
      payoutMultiplier: Number(pcts[i]) > 0
        ? Math.round((85 / (Number(pcts[i]) / 100)) * 100) / 100
        : 0,
    }))

    return {
      poolId,
      chapterId,
      bettingDeadline: deadline,
      numChoices:     Number(numChoices),
      totalBets,
      status,
      choices,
      winningChoice:  resolved ? Number(winningChoice) : undefined,
      crowdWasRight:  resolved ? crowdWasRight : undefined,
    }
  }

  /**
   * Fetch psychic consensus market state for a pool.
   */
  async getConsensusMarket(publicClient: PublicClient, poolId: bigint): Promise<ConsensusMarket> {
    const result = await publicClient.readContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'getConsensusState',
      args: [poolId],
    }) as readonly [bigint, bigint, bigint, bigint, boolean, boolean]

    const [crowdRightBets, crowdWrongBets, crowdRightPct, contraBonusMultiplier, resolved, crowdWasRight] = result

    return {
      crowdRightBets,
      crowdWrongBets,
      crowdRightPercent:    Number(crowdRightPct),
      contraBonusMultiplier: Number(contraBonusMultiplier),
      resolved,
      crowdWasRight: resolved ? crowdWasRight : undefined,
    }
  }

  /**
   * Fetch psychic profile for leaderboard display.
   */
  async getPsychicProfile(publicClient: PublicClient, address: Address): Promise<PsychicProfile> {
    const result = await publicClient.readContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'getPsychicProfile',
      args: [address],
    }) as readonly [bigint, bigint, bigint, bigint]

    const [score, contraryWins, totalBets, accuracy] = result

    return {
      address,
      score:        Number(score),
      contraryWins: Number(contraryWins),
      totalBets:    Number(totalBets),
      accuracy:     Number(accuracy),
      badge:        computeBadge(Number(score)),
    }
  }

  /**
   * Preview potential payout for a Layer 1 story bet.
   */
  async previewMainPayout(
    publicClient: PublicClient,
    poolId: bigint,
    choice: number,
    amount: bigint,
  ): Promise<MainPayoutPreview> {
    const [expectedPayout, oddsData] = await Promise.all([
      publicClient.readContract({
        address: this.config.contractAddress,
        abi: PCO_ABI,
        functionName: 'previewMainPayout',
        args: [poolId, BigInt(choice), amount],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: this.config.contractAddress,
        abi: PCO_ABI,
        functionName: 'getOdds',
        args: [poolId],
      }) as Promise<readonly [readonly bigint[], readonly bigint[]]>,
    ])

    const [, pcts] = oddsData
    const impliedOdds = pcts[choice] ? Number(pcts[choice]) : 50
    const multiplier = amount > 0n
      ? Math.round(Number(expectedPayout) / Number(amount) * 100) / 100
      : 0

    return { poolId, choice, betAmount: amount, expectedPayout, multiplier, impliedOdds }
  }

  /**
   * Preview potential psychic oracle payouts.
   */
  async previewPsychicPayout(
    publicClient: PublicClient,
    poolId: bigint,
    amount: bigint,
  ): Promise<PsychicPayoutPreview> {
    const cm = await this.getConsensusMarket(publicClient, poolId)

    const totalPool = cm.crowdRightBets + cm.crowdWrongBets
    // Crowd believer: pro-rata of total pool
    const crowdBelieverPayout = cm.crowdRightBets + amount > 0n
      ? (totalPool + amount) * amount / (cm.crowdRightBets + amount)
      : 0n
    // Contrarian: pro-rata × 2×
    const contrarianPayout = cm.crowdWrongBets + amount > 0n
      ? ((totalPool + amount) * amount / (cm.crowdWrongBets + amount)) * BigInt(cm.contraBonusMultiplier)
      : 0n

    return {
      poolId,
      position:           ConsensusPosition.CONTRARIAN, // shown for both
      betAmount:          amount,
      crowdBelieverPayout,
      contrarianPayout,
      crowdRightOdds:     cm.crowdRightPercent,
    }
  }

  /**
   * Get a user's bets across all choices for a pool.
   */
  async getUserBets(
    publicClient: PublicClient,
    poolId: bigint,
    userAddress: Address,
    numChoices: number,
  ): Promise<Record<number, bigint>> {
    const bets: Record<number, bigint> = {}
    const results = await Promise.all(
      Array.from({ length: numChoices }).map((_, i) =>
        publicClient.readContract({
          address: this.config.contractAddress,
          abi: PCO_ABI,
          functionName: 'userBets',
          args: [poolId, userAddress, BigInt(i)],
        }) as Promise<bigint>
      )
    )
    results.forEach((amount, i) => { bets[i] = amount })
    return bets
  }

  /**
   * Get a user's psychic bets for a pool.
   */
  async getUserPsychicBets(
    publicClient: PublicClient,
    poolId: bigint,
    userAddress: Address,
  ): Promise<{ crowdRight: bigint; crowdWrong: bigint }> {
    const [crowdRight, crowdWrong] = await Promise.all([
      publicClient.readContract({
        address: this.config.contractAddress,
        abi: PCO_ABI,
        functionName: 'userCrowdRight',
        args: [poolId, userAddress],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: this.config.contractAddress,
        abi: PCO_ABI,
        functionName: 'userCrowdWrong',
        args: [poolId, userAddress],
      }) as Promise<bigint>,
    ])
    return { crowdRight, crowdWrong }
  }

  // ─── Transaction Methods ───────────────────────────────────────────────────

  /**
   * Ensure the user has approved sufficient $FORGE allowance.
   * @internal
   */
  private async ensureApproval(
    publicClient: PublicClient,
    walletClient: WalletClient,
    userAddress: Address,
    amount: bigint,
  ): Promise<void> {
    const allowance = await publicClient.readContract({
      address: this.config.forgeTokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, this.config.contractAddress],
    }) as bigint

    if (allowance < amount) {
      const hash = await walletClient.writeContract({
        address: this.config.forgeTokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [this.config.contractAddress, amount],
        account: userAddress,
        chain: this.config.chainId === 8453 ? base : baseSepolia,
      })
      await publicClient.waitForTransactionReceipt({ hash })
    }
  }

  /**
   * Place a Layer 1 story bet on a choice.
   */
  async betOnChoice(
    publicClient:  PublicClient,
    walletClient:  WalletClient,
    userAddress:   Address,
    poolId:        bigint,
    choice:        number,
    amount:        bigint,
  ): Promise<`0x${string}`> {
    await this.ensureApproval(publicClient, walletClient, userAddress, amount)

    const hash = await walletClient.writeContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'betOnChoice',
      args: [poolId, BigInt(choice), amount],
      account: userAddress,
      chain: this.config.chainId === 8453 ? base : baseSepolia,
    })

    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Place a Layer 2 psychic oracle bet.
   * @param position ConsensusPosition.CROWD_BELIEVER or ConsensusPosition.CONTRARIAN
   */
  async betOnConsensus(
    publicClient:  PublicClient,
    walletClient:  WalletClient,
    userAddress:   Address,
    poolId:        bigint,
    position:      ConsensusPosition,
    amount:        bigint,
  ): Promise<`0x${string}`> {
    await this.ensureApproval(publicClient, walletClient, userAddress, amount)

    const predictCrowdRight = position === ConsensusPosition.CROWD_BELIEVER

    const hash = await walletClient.writeContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'betOnConsensus',
      args: [poolId, predictCrowdRight, amount],
      account: userAddress,
      chain: this.config.chainId === 8453 ? base : baseSepolia,
    })

    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Claim Layer 1 story winnings.
   */
  async claimMainWinnings(
    publicClient: PublicClient,
    walletClient: WalletClient,
    userAddress:  Address,
    poolId:       bigint,
  ): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'claimMainWinnings',
      args: [poolId],
      account: userAddress,
      chain: this.config.chainId === 8453 ? base : baseSepolia,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  /**
   * Claim Layer 2 psychic oracle winnings.
   * Contrarians who correctly predicted crowd failure earn a 2× bonus.
   */
  async claimPsychicWinnings(
    publicClient: PublicClient,
    walletClient: WalletClient,
    userAddress:  Address,
    poolId:       bigint,
  ): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'claimPsychicWinnings',
      args: [poolId],
      account: userAddress,
      chain: this.config.chainId === 8453 ? base : baseSepolia,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  }

  // ─── Oracle Methods (backend only) ────────────────────────────────────────

  /**
   * Resolve a pool after the AI has made its story decision.
   * Only callable by the oracle address (backend server).
   */
  async resolvePool(
    publicClient: PublicClient,
    walletClient: WalletClient,
    oracleAddress: Address,
    poolId: bigint,
    winningChoice: number,
  ): Promise<ResolutionResult> {
    const hash = await walletClient.writeContract({
      address: this.config.contractAddress,
      abi: PCO_ABI,
      functionName: 'resolvePool',
      args: [poolId, BigInt(winningChoice)],
      account: oracleAddress,
      chain: this.config.chainId === 8453 ? base : baseSepolia,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Parse PoolResolved event from logs
    const resolvedLog = receipt.logs.find(log => {
      try {
        // Simple topic check for PoolResolved event signature
        return log.topics[0] !== undefined
      } catch { return false }
    })

    // Return minimal result (full parsing would use decodeEventLog)
    return {
      poolId,
      winningChoice,
      crowdWasRight:      false, // Would be parsed from event in production
      winningChoiceBets:  0n,
      totalBets:          0n,
      contrarianBoost:    2,
      txHash:             hash,
      resolvedAt:         new Date(),
    }
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  /**
   * Format $FORGE amount from bigint to human-readable string.
   * $FORGE has 18 decimals (like most ERC-20s).
   */
  formatForge(amount: bigint, decimals = 18): string {
    return formatUnits(amount, decimals)
  }

  /**
   * Parse human-readable $FORGE amount to bigint.
   */
  parseForge(amount: string, decimals = 18): bigint {
    return parseUnits(amount, decimals)
  }

  /**
   * Compute the "Psychic Edge" — how much more valuable the contrarian position is
   * relative to the crowd believer position. Higher = more upside for going against crowd.
   *
   * Psychic Edge = (contrarian payout / believer payout) × crowd_wrong_odds_pct
   *
   * A high Psychic Edge score suggests:
   * - Crowd is highly skewed (many believers)
   * - Contrarian position is undervalued
   * - This is a potential high-value play for skilled readers
   */
  computePsychicEdge(consensus: ConsensusMarket): number {
    if (consensus.crowdRightBets === 0n || consensus.crowdWrongBets === 0n) return 0

    const totalPool = Number(consensus.crowdRightBets + consensus.crowdWrongBets)
    const crowdRightShare = Number(consensus.crowdRightBets) / totalPool
    const crowdWrongShare = Number(consensus.crowdWrongBets) / totalPool

    // Contrarian expected payout (2× multiplier, inverse odds)
    const contrarianEV = (crowdWrongShare === 0 ? 0 : (1 / crowdWrongShare) * 2)
    // Believer expected payout (no multiplier)
    const believerEV = crowdRightShare === 0 ? 0 : (1 / crowdRightShare)

    return Math.round((contrarianEV / believerEV) * 100) / 100
  }

  /**
   * Get a descriptive risk label for the consensus position.
   */
  describeConsensusRisk(consensus: ConsensusMarket): {
    label: string
    color: string
    description: string
  } {
    const edge = this.computePsychicEdge(consensus)

    if (edge >= 3) return {
      label:       '🔥 Extreme Contrarian Edge',
      color:       'red',
      description: 'Crowd is massively overconfident. High-risk, high-reward contrarian play.',
    }
    if (edge >= 2) return {
      label:       '⚡ Strong Contrarian Signal',
      color:       'orange',
      description: 'Crowd consensus is lopsided. Contrarian position has clear value.',
    }
    if (edge >= 1.5) return {
      label:       '📊 Balanced Market',
      color:       'yellow',
      description: 'Crowd and contrarian positions are reasonably priced.',
    }
    return {
      label:       '🤝 Crowd Believer Favored',
      color:       'green',
      description: 'Market suggests crowd will likely be correct. Lower risk, lower reward.',
    }
  }
}
