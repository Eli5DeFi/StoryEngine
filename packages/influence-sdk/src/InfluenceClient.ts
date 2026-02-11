/**
 * Voidborne Influence Token SDK
 * 
 * TypeScript client for interacting with the InfluenceToken smart contract
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseAbi,
  formatUnits,
  parseUnits,
  Address,
  WalletClient,
  PublicClient
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ============================================================================
// TYPES
// ============================================================================

export interface UserStats {
  totalEarned: bigint
  totalSpent: bigint
  totalVotes: bigint
  currentStreak: bigint
  longestStreak: bigint
  lastWinTimestamp: bigint
}

export interface Vote {
  poolId: bigint
  choiceId: number
  amount: bigint
  voter: Address
  timestamp: bigint
}

export interface LeaderboardEntry {
  address: Address
  balance: bigint
  balanceFormatted: string
  totalEarned: bigint
  totalSpent: bigint
  totalVotes: bigint
  currentStreak: bigint
  longestStreak: bigint
}

export interface PoolVoteData {
  totalInfluence: bigint
  choiceInfluences: Record<number, bigint>
  userVote: bigint
}

// ============================================================================
// ABI
// ============================================================================

const INFLUENCE_TOKEN_ABI = parseAbi([
  // ERC20
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  
  // Minting
  'function mintInfluence(address winner, uint256 profit)',
  'function calculateStreakBonus(address user) view returns (uint256)',
  
  // Voting
  'function voteWithInfluence(uint256 poolId, uint8 choiceId, uint256 amount)',
  'function getInfluenceBoost(uint256 poolId, uint8 choiceId) view returns (uint256)',
  'function getTotalInfluence(uint256 poolId) view returns (uint256)',
  'function getChoiceInfluence(uint256 poolId, uint8 choiceId) view returns (uint256)',
  'function getUserVoteOnPool(uint256 poolId, address user) view returns (uint256)',
  
  // Stats & Leaderboard
  'function getUserStats(address user) view returns (tuple(uint256 totalEarned, uint256 totalSpent, uint256 totalVotes, uint256 currentStreak, uint256 longestStreak, uint256 lastWinTimestamp))',
  'function getTopHolders(uint256 n) view returns (address[])',
  'function getUserVotes(address user) view returns (uint256[])',
  'function getVote(uint256 index) view returns (tuple(uint256 poolId, uint8 choiceId, uint256 amount, address voter, uint256 timestamp))',
  'function getTotalVotes() view returns (uint256)',
  
  // Events
  'event InfluenceEarned(address indexed user, uint256 amount, uint256 profit, uint256 streakBonus, uint256 newBalance)',
  'event InfluenceVoted(uint256 indexed poolId, address indexed voter, uint8 indexed choiceId, uint256 amount, uint256 timestamp)',
  'event StreakUpdated(address indexed user, uint256 newStreak, uint256 longestStreak)',
])

// ============================================================================
// CLIENT
// ============================================================================

export class InfluenceClient {
  private publicClient: PublicClient
  private walletClient?: WalletClient
  private contractAddress: Address
  private account?: Address
  
  constructor(
    contractAddress: Address,
    options: {
      rpcUrl?: string
      privateKey?: `0x${string}`
      chain?: typeof base | typeof baseSepolia
    } = {}
  ) {
    const chain = options.chain || base
    const rpcUrl = options.rpcUrl || (chain === base 
      ? 'https://mainnet.base.org' 
      : 'https://sepolia.base.org')
    
    this.contractAddress = contractAddress
    
    // Create public client (read-only)
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    })
    
    // Create wallet client if private key provided (read-write)
    if (options.privateKey) {
      const account = privateKeyToAccount(options.privateKey)
      this.account = account.address
      
      this.walletClient = createWalletClient({
        account,
        chain,
        transport: http(rpcUrl),
      })
    }
  }
  
  // ==========================================================================
  // READ METHODS
  // ==========================================================================
  
  /**
   * Get INFLUENCE balance for an address
   */
  async getBalance(address: Address): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address],
    })
  }
  
  /**
   * Get INFLUENCE balance formatted (e.g., "1,234.56")
   */
  async getBalanceFormatted(address: Address): Promise<string> {
    const balance = await this.getBalance(address)
    return formatUnits(balance, 18)
  }
  
  /**
   * Get total INFLUENCE supply
   */
  async getTotalSupply(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'totalSupply',
    })
  }
  
  /**
   * Get user statistics
   */
  async getUserStats(address: Address): Promise<UserStats> {
    const stats = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'getUserStats',
      args: [address],
    }) as any
    
    return {
      totalEarned: stats.totalEarned,
      totalSpent: stats.totalSpent,
      totalVotes: stats.totalVotes,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastWinTimestamp: stats.lastWinTimestamp,
    }
  }
  
  /**
   * Calculate streak bonus for a user (0-100%)
   */
  async getStreakBonus(address: Address): Promise<number> {
    const bonus = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'calculateStreakBonus',
      args: [address],
    })
    
    return Number(bonus)
  }
  
  /**
   * Get leaderboard (top N holders)
   */
  async getLeaderboard(n: number = 100): Promise<LeaderboardEntry[]> {
    const addresses = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'getTopHolders',
      args: [BigInt(n)],
    }) as Address[]
    
    // Fetch details for each address
    const entries = await Promise.all(
      addresses.map(async (address) => {
        const [balance, stats] = await Promise.all([
          this.getBalance(address),
          this.getUserStats(address),
        ])
        
        return {
          address,
          balance,
          balanceFormatted: formatUnits(balance, 18),
          totalEarned: stats.totalEarned,
          totalSpent: stats.totalSpent,
          totalVotes: stats.totalVotes,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
        }
      })
    )
    
    // Sort by balance (descending)
    return entries.sort((a, b) => 
      Number(b.balance - a.balance)
    )
  }
  
  /**
   * Get pool voting data
   */
  async getPoolVoteData(
    poolId: bigint,
    userAddress?: Address
  ): Promise<PoolVoteData> {
    const totalInfluence = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'getTotalInfluence',
      args: [poolId],
    })
    
    // Get influence for each choice (0-4)
    const choiceInfluences: Record<number, bigint> = {}
    for (let i = 0; i < 5; i++) {
      const influence = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: INFLUENCE_TOKEN_ABI,
        functionName: 'getChoiceInfluence',
        args: [poolId, i],
      })
      choiceInfluences[i] = influence
    }
    
    // Get user's vote if address provided
    let userVote = 0n
    if (userAddress) {
      userVote = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: INFLUENCE_TOKEN_ABI,
        functionName: 'getUserVoteOnPool',
        args: [poolId, userAddress],
      })
    }
    
    return {
      totalInfluence,
      choiceInfluences,
      userVote,
    }
  }
  
  /**
   * Get influence boost percentage for a choice (0-100%)
   */
  async getInfluenceBoost(poolId: bigint, choiceId: number): Promise<number> {
    const boost = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'getInfluenceBoost',
      args: [poolId, choiceId],
    })
    
    return Number(boost)
  }
  
  /**
   * Get user's vote history
   */
  async getUserVoteHistory(address: Address): Promise<Vote[]> {
    const indices = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'getUserVotes',
      args: [address],
    }) as bigint[]
    
    const votes = await Promise.all(
      indices.map(async (index) => {
        const vote = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: INFLUENCE_TOKEN_ABI,
          functionName: 'getVote',
          args: [index],
        }) as any
        
        return {
          poolId: vote.poolId,
          choiceId: vote.choiceId,
          amount: vote.amount,
          voter: vote.voter,
          timestamp: vote.timestamp,
        }
      })
    )
    
    return votes
  }
  
  // ==========================================================================
  // WRITE METHODS
  // ==========================================================================
  
  /**
   * Vote with INFLUENCE tokens
   * @param poolId Betting pool ID
   * @param choiceId Choice to vote for (0-4)
   * @param amount Amount of INFLUENCE to spend (in tokens, e.g., "100")
   */
  async vote(
    poolId: bigint,
    choiceId: number,
    amount: string
  ): Promise<`0x${string}`> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet client not initialized. Provide privateKey in constructor.')
    }
    
    const amountWei = parseUnits(amount, 18)
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'voteWithInfluence',
      args: [poolId, choiceId, amountWei],
      account: this.account,
    })
    
    return hash
  }
  
  /**
   * Mint INFLUENCE tokens to a winner (admin only)
   */
  async mintInfluence(
    winner: Address,
    profit: bigint
  ): Promise<`0x${string}`> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet client not initialized. Provide privateKey in constructor.')
    }
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: INFLUENCE_TOKEN_ABI,
      functionName: 'mintInfluence',
      args: [winner, profit],
      account: this.account,
    })
    
    return hash
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  /**
   * Format INFLUENCE amount (bigint → string)
   */
  formatInfluence(amount: bigint): string {
    return formatUnits(amount, 18)
  }
  
  /**
   * Parse INFLUENCE amount (string → bigint)
   */
  parseInfluence(amount: string): bigint {
    return parseUnits(amount, 18)
  }
  
  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: `0x${string}`): Promise<any> {
    return await this.publicClient.waitForTransactionReceipt({ hash })
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create InfluenceClient for Base mainnet
 */
export function createInfluenceClient(
  contractAddress: Address,
  privateKey?: `0x${string}`
): InfluenceClient {
  return new InfluenceClient(contractAddress, {
    chain: base,
    privateKey,
  })
}

/**
 * Create InfluenceClient for Base Sepolia testnet
 */
export function createInfluenceClientTestnet(
  contractAddress: Address,
  privateKey?: `0x${string}`
): InfluenceClient {
  return new InfluenceClient(contractAddress, {
    chain: baseSepolia,
    privateKey,
  })
}
