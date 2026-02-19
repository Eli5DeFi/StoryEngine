import { createPublicClient, createWalletClient, http, parseUnits, type Address, type Hash } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export interface VoidborneConfig {
  apiUrl?: string
  network?: 'mainnet' | 'testnet'
  privateKey?: `0x${string}`
  rpcUrl?: string
}

export interface Story {
  id: string
  title: string
  description: string
  genre: string
  currentChapter: number
  totalChapters: number
  chapters: Chapter[]
}

export interface Chapter {
  id: string
  chapterNumber: number
  title: string
  content: string
  choices: Choice[]
  bettingPool?: BettingPool
}

export interface Choice {
  id: string
  text: string
  order: number
}

export interface BettingPool {
  id: string
  contractAddress: string
  totalAmount: string
  choicePools: Array<{
    choiceId: string
    amount: string
    bettorCount: number
  }>
  status: string
  deadline: string
}

export interface PlaceBetParams {
  poolId: string
  choiceId: string
  amount: string // Amount in USDC (e.g., "10.5")
}

export class VoidborneSDK {
  private apiUrl: string
  private network: 'mainnet' | 'testnet'
  private account?: ReturnType<typeof privateKeyToAccount>
  private publicClient: ReturnType<typeof createPublicClient>
  private walletClient?: ReturnType<typeof createWalletClient>

  constructor(config: VoidborneConfig = {}) {
    this.apiUrl = config.apiUrl || (config.network === 'mainnet' ? 'https://voidborne.ai/api' : 'http://localhost:3000/api')
    this.network = config.network || 'testnet'

    const chain = this.network === 'mainnet' ? base : baseSepolia
    const rpcUrl = config.rpcUrl || (this.network === 'mainnet' 
      ? 'https://mainnet.base.org' 
      : 'https://sepolia.base.org')

    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    if (config.privateKey) {
      this.account = privateKeyToAccount(config.privateKey)
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http(rpcUrl)
      })
    }
  }

  // ==================== Story Methods ====================

  /**
   * Get all available stories
   */
  async getStories(): Promise<Story[]> {
    const response = await fetch(`${this.apiUrl}/stories`)
    const data = await response.json()
    return data.stories
  }

  /**
   * Get a specific story by ID
   */
  async getStory(storyId: string): Promise<Story> {
    const response = await fetch(`${this.apiUrl}/stories/${storyId}`)
    return response.json()
  }

  /**
   * Get the main Voidborne story (convenience method)
   */
  async getVoidborneStory(): Promise<Story> {
    return this.getStory('voidborne-story')
  }

  // ==================== Betting Methods ====================

  /**
   * Get betting pool details
   */
  async getBettingPool(poolId: string): Promise<BettingPool> {
    const response = await fetch(`${this.apiUrl}/betting/pools/${poolId}`)
    return response.json()
  }

  /**
   * Place a bet on a story choice (requires private key in config)
   */
  async placeBet(params: PlaceBetParams): Promise<{ success: boolean; hash?: Hash; error?: string }> {
    if (!this.account || !this.walletClient) {
      throw new Error('Private key required for betting. Initialize SDK with privateKey in config.')
    }

    try {
      // Get pool details to get contract address
      const pool = await this.getBettingPool(params.poolId)
      
      // Convert USDC amount (6 decimals)
      const amountInWei = parseUnits(params.amount, 6)

      // 1. Approve USDC spending
      const USDC_ADDRESS = this.network === 'mainnet' 
        ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base mainnet
        : '0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132' // Base Sepolia (mock)

      const approveHash = await this.walletClient.writeContract({
        address: USDC_ADDRESS as Address,
        abi: [{
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }],
        functionName: 'approve',
        args: [pool.contractAddress as Address, amountInWei]
      })

      await this.publicClient.waitForTransactionReceipt({ hash: approveHash })

      // 2. Place bet
      const betHash = await this.walletClient.writeContract({
        address: pool.contractAddress as Address,
        abi: [{
          name: 'placeBet',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'choiceId', type: 'uint256' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: []
        }],
        functionName: 'placeBet',
        args: [BigInt(params.choiceId), amountInWei]
      })

      await this.publicClient.waitForTransactionReceipt({ hash: betHash })

      // 3. Record bet in API
      const response = await fetch(`${this.apiUrl}/betting/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: params.poolId,
          choiceId: params.choiceId,
          amount: params.amount,
          walletAddress: this.account.address
        })
      })

      const result = await response.json()
      return { success: result.success, hash: betHash }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get user's betting history
   */
  async getUserBets(walletAddress: string): Promise<any[]> {
    const response = await fetch(`${this.apiUrl}/users/${walletAddress}`)
    const data = await response.json()
    return data.bets || []
  }

  // ==================== Analysis Methods ====================

  /**
   * Calculate odds for each choice in a betting pool
   */
  calculateOdds(pool: BettingPool): Record<string, number> {
    const total = parseFloat(pool.totalAmount)
    if (total === 0) return {}

    const odds: Record<string, number> = {}
    for (const choice of pool.choicePools) {
      const choiceAmount = parseFloat(choice.amount)
      odds[choice.choiceId] = choiceAmount > 0 ? total / choiceAmount : 0
    }
    return odds
  }

  /**
   * Find the choice with the best expected value
   */
  findBestValue(pool: BettingPool): { choiceId: string; ev: number } | null {
    const odds = this.calculateOdds(pool)
    let bestChoice: { choiceId: string; ev: number } | null = null

    for (const [choiceId, odd] of Object.entries(odds)) {
      // Simple EV calculation (assumes equal probability)
      // In production, you'd use AI sentiment/analysis for better probabilities
      const ev = odd * 0.85 // 85% payout
      if (!bestChoice || ev > bestChoice.ev) {
        bestChoice = { choiceId, ev }
      }
    }

    return bestChoice
  }
}

// Export types
export type { Address, Hash }
export * from 'viem'

// ─── Innovation Cycle #53: The Living Story Protocol ──────────────────────────

// Narrative Consequence Ledger — persistent cross-chapter consequence tracking.
// Every bet outcome creates a typed consequence injected into Claude's next
// chapter prompt. Players bet on when consequences resolve (8x exact chapter).
export {
  ConsequenceRecorder,
  ConsequenceLedger,
  NarrativeDebtEngine,
  ClaudeContextBuilder as NCLContextBuilder,
  ConsequenceBetMarket,
  LivingStoryOrchestrator,
  createLivingStoryEngine,
  runConsequenceLedgerDemo,
} from './consequence-ledger'
export type {
  ConsequenceStatus,
  ConsequenceSeverity,
  ConsequenceVector,
  NarrativeConsequence,
  ConsequenceBet,
  NarrativeDebtReport,
  ChapterConsequenceContext,
} from './consequence-ledger'

// Chaos Oracle Protocol — real-world signals (BTC price, social mentions,
// on-chain volume) mapped to narrative parameters. The story reacts to markets.
export {
  SignalFetcher,
  ChaosMapper,
  ChaosMarketEngine,
  ClaudeChaosInjector,
  ChaosSignalArchive,
  ChaosOracleEngine,
  createChaosOracleEngine,
  runChaosOracleDemo,
} from './chaos-oracle'
export type {
  SignalSource,
  SignalDirection,
  RawSignal,
  NarrativeMapping,
  ChaosSignal,
  ChaosMarket,
  ChaosMarketBet,
  ChaosChapterContext,
} from './chaos-oracle'
