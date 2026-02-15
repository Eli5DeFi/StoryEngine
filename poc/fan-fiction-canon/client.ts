/**
 * Fan Fiction Canon - TypeScript Client
 * 
 * Client library for interacting with FanFictionCanon smart contract
 */

import { ethers } from 'ethers'

// Contract ABI (simplified - include full ABI in production)
const FAN_FICTION_CANON_ABI = [
  // Submission functions
  'function submitStory(string storyHash, string title, uint256 characterId) payable returns (uint256)',
  'function getSubmission(uint256 id) view returns (tuple(uint256 id, address author, string storyHash, string title, uint256 characterId, uint256 timestamp, uint256 votingEnds, bool finalized, bool isCanon, uint256 aiScore, uint256 communityScore))',
  
  // Pool functions
  'function createPool(uint256[] submissionIds) returns (uint256)',
  'function placeBet(uint256 poolId, uint256 submissionId, uint256 amount)',
  'function settlePool(uint256 poolId, uint256[] aiScores, uint256[] communityScores)',
  'function getPoolInfo(uint256 poolId) view returns (uint256[] submissionIds, uint256 totalPool, bool settled, uint256 winnerId, uint256 totalBettors)',
  'function getSubmissionBets(uint256 poolId, uint256 submissionId) view returns (uint256)',
  'function calculatePayout(uint256 poolId, uint256 submissionId, uint256 betAmount) view returns (uint256)',
  
  // Claim functions
  'function claimEarnings()',
  'function claimWinnings(uint256 poolId)',
  
  // View functions
  'function authorEarnings(address author) view returns (uint256)',
  'function authorSubmissions(address author) view returns (uint256)',
  'function nextSubmissionId() view returns (uint256)',
  'function nextPoolId() view returns (uint256)',
  
  // Constants
  'function SUBMISSION_FEE() view returns (uint256)',
  'function AUTHOR_SHARE() view returns (uint256)',
  'function BETTOR_SHARE() view returns (uint256)',
  
  // Events
  'event SubmissionCreated(uint256 indexed id, address indexed author, string title, string storyHash, uint256 characterId)',
  'event PoolCreated(uint256 indexed poolId, uint256[] submissionIds)',
  'event BetPlaced(uint256 indexed poolId, address indexed bettor, uint256 indexed submissionId, uint256 amount)',
  'event PoolSettled(uint256 indexed poolId, uint256 indexed winnerId, uint256 finalScore)',
  'event CanonAwarded(uint256 indexed submissionId, address indexed author, uint256 earnings)',
]

export interface Submission {
  id: number
  author: string
  storyHash: string
  title: string
  characterId: number
  timestamp: number
  votingEnds: number
  finalized: boolean
  isCanon: boolean
  aiScore: number
  communityScore: number
}

export interface Pool {
  submissionIds: number[]
  totalPool: bigint
  settled: boolean
  winnerId: number
  totalBettors: number
}

export class FanFictionCanonClient {
  private contract: ethers.Contract
  private signer: ethers.Signer
  
  constructor(
    contractAddress: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ) {
    this.contract = new ethers.Contract(
      contractAddress,
      FAN_FICTION_CANON_ABI,
      signerOrProvider
    )
    
    if ('getAddress' in signerOrProvider) {
      this.signer = signerOrProvider as ethers.Signer
    } else {
      throw new Error('Signer required for write operations')
    }
  }
  
  // ============================================================================
  // SUBMISSION FUNCTIONS
  // ============================================================================
  
  /**
   * Submit a fan fiction story
   * @param storyHash IPFS hash of story content
   * @param title Story title
   * @param characterId Character the story is about
   * @returns Submission ID
   */
  async submitStory(
    storyHash: string,
    title: string,
    characterId: number
  ): Promise<number> {
    const submissionFee = await this.contract.SUBMISSION_FEE()
    
    const tx = await this.contract.submitStory(
      storyHash,
      title,
      characterId,
      { value: submissionFee }
    )
    
    const receipt = await tx.wait()
    
    // Parse SubmissionCreated event
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'SubmissionCreated'
    )
    
    if (event) {
      return Number(event.args.id)
    }
    
    throw new Error('Submission ID not found in transaction receipt')
  }
  
  /**
   * Get submission details
   */
  async getSubmission(submissionId: number): Promise<Submission> {
    const result = await this.contract.getSubmission(submissionId)
    
    return {
      id: Number(result.id),
      author: result.author,
      storyHash: result.storyHash,
      title: result.title,
      characterId: Number(result.characterId),
      timestamp: Number(result.timestamp),
      votingEnds: Number(result.votingEnds),
      finalized: result.finalized,
      isCanon: result.isCanon,
      aiScore: Number(result.aiScore),
      communityScore: Number(result.communityScore),
    }
  }
  
  /**
   * Get all submissions by an author
   */
  async getAuthorSubmissions(authorAddress: string): Promise<number> {
    return Number(await this.contract.authorSubmissions(authorAddress))
  }
  
  // ============================================================================
  // POOL FUNCTIONS
  // ============================================================================
  
  /**
   * Create betting pool (owner only)
   */
  async createPool(submissionIds: number[]): Promise<number> {
    if (submissionIds.length !== 3) {
      throw new Error('Pool must have exactly 3 submissions')
    }
    
    const tx = await this.contract.createPool(submissionIds)
    const receipt = await tx.wait()
    
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'PoolCreated'
    )
    
    if (event) {
      return Number(event.args.poolId)
    }
    
    throw new Error('Pool ID not found in transaction receipt')
  }
  
  /**
   * Get pool information
   */
  async getPoolInfo(poolId: number): Promise<Pool> {
    const result = await this.contract.getPoolInfo(poolId)
    
    return {
      submissionIds: result.submissionIds.map(Number),
      totalPool: result.totalPool,
      settled: result.settled,
      winnerId: Number(result.winnerId),
      totalBettors: Number(result.totalBettors),
    }
  }
  
  /**
   * Get total bets on a submission
   */
  async getSubmissionBets(
    poolId: number,
    submissionId: number
  ): Promise<bigint> {
    return await this.contract.getSubmissionBets(poolId, submissionId)
  }
  
  /**
   * Calculate odds for a submission (as percentage)
   */
  async getOdds(poolId: number, submissionId: number): Promise<number> {
    const pool = await this.getPoolInfo(poolId)
    
    if (pool.totalPool === 0n) return 0
    
    const submissionBets = await this.getSubmissionBets(poolId, submissionId)
    
    return Number((submissionBets * 10000n) / pool.totalPool) / 100
  }
  
  /**
   * Calculate all odds for pool
   */
  async getAllOdds(poolId: number): Promise<Record<number, number>> {
    const pool = await this.getPoolInfo(poolId)
    const odds: Record<number, number> = {}
    
    for (const submissionId of pool.submissionIds) {
      odds[submissionId] = await this.getOdds(poolId, submissionId)
    }
    
    return odds
  }
  
  /**
   * Calculate potential payout for a bet
   */
  async calculatePayout(
    poolId: number,
    submissionId: number,
    betAmount: bigint
  ): Promise<bigint> {
    return await this.contract.calculatePayout(poolId, submissionId, betAmount)
  }
  
  // ============================================================================
  // BETTING FUNCTIONS
  // ============================================================================
  
  /**
   * Place a bet on a submission
   * @param poolId Pool ID
   * @param submissionId Submission to bet on
   * @param amount Bet amount (in wei/smallest unit)
   * @param tokenAddress ERC20 token address (USDC, etc.)
   */
  async placeBet(
    poolId: number,
    submissionId: number,
    amount: bigint,
    tokenAddress: string
  ): Promise<void> {
    // First approve token spending
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.signer
    )
    
    const approveTx = await tokenContract.approve(
      await this.contract.getAddress(),
      amount
    )
    await approveTx.wait()
    
    // Place bet
    const betTx = await this.contract.placeBet(poolId, submissionId, amount)
    await betTx.wait()
  }
  
  /**
   * Settle pool (owner only)
   */
  async settlePool(
    poolId: number,
    aiScores: [number, number, number],
    communityScores: [number, number, number]
  ): Promise<number> {
    // Validate scores
    if (aiScores.some(s => s < 0 || s > 100)) {
      throw new Error('AI scores must be 0-100')
    }
    
    const total = communityScores.reduce((a, b) => a + b, 0)
    if (total !== 10000) {
      throw new Error('Community scores must sum to 10000 (100%)')
    }
    
    const tx = await this.contract.settlePool(poolId, aiScores, communityScores)
    const receipt = await tx.wait()
    
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'PoolSettled'
    )
    
    if (event) {
      return Number(event.args.winnerId)
    }
    
    throw new Error('Winner ID not found in transaction receipt')
  }
  
  // ============================================================================
  // CLAIM FUNCTIONS
  // ============================================================================
  
  /**
   * Claim author earnings
   */
  async claimEarnings(): Promise<void> {
    const tx = await this.contract.claimEarnings()
    await tx.wait()
  }
  
  /**
   * Claim betting winnings
   */
  async claimWinnings(poolId: number): Promise<void> {
    const tx = await this.contract.claimWinnings(poolId)
    await tx.wait()
  }
  
  /**
   * Get claimable author earnings
   */
  async getAuthorEarnings(authorAddress: string): Promise<bigint> {
    return await this.contract.authorEarnings(authorAddress)
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Get submission fee
   */
  async getSubmissionFee(): Promise<bigint> {
    return await this.contract.SUBMISSION_FEE()
  }
  
  /**
   * Get revenue split percentages
   */
  async getRevenueSplit(): Promise<{
    authorShare: number
    bettorShare: number
    platformShare: number
  }> {
    const [authorShare, bettorShare] = await Promise.all([
      this.contract.AUTHOR_SHARE(),
      this.contract.BETTOR_SHARE(),
    ])
    
    return {
      authorShare: Number(authorShare) / 100,
      bettorShare: Number(bettorShare) / 100,
      platformShare: (10000 - Number(authorShare) - Number(bettorShare)) / 100,
    }
  }
  
  /**
   * Watch for submission events
   */
  onSubmissionCreated(
    callback: (submissionId: number, author: string, title: string) => void
  ): void {
    this.contract.on('SubmissionCreated', (id, author, title) => {
      callback(Number(id), author, title)
    })
  }
  
  /**
   * Watch for pool created events
   */
  onPoolCreated(
    callback: (poolId: number, submissionIds: number[]) => void
  ): void {
    this.contract.on('PoolCreated', (poolId, submissionIds) => {
      callback(Number(poolId), submissionIds.map(Number))
    })
  }
  
  /**
   * Watch for bet events
   */
  onBetPlaced(
    callback: (poolId: number, bettor: string, submissionId: number, amount: bigint) => void
  ): void {
    this.contract.on('BetPlaced', (poolId, bettor, submissionId, amount) => {
      callback(Number(poolId), bettor, Number(submissionId), amount)
    })
  }
  
  /**
   * Watch for pool settlement
   */
  onPoolSettled(
    callback: (poolId: number, winnerId: number, finalScore: number) => void
  ): void {
    this.contract.on('PoolSettled', (poolId, winnerId, finalScore) => {
      callback(Number(poolId), Number(winnerId), Number(finalScore))
    })
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export async function exampleUsage() {
  // Setup
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org')
  const wallet = new ethers.Wallet('PRIVATE_KEY', provider)
  const contractAddress = '0x...' // Deployed contract address
  
  const client = new FanFictionCanonClient(contractAddress, wallet)
  
  // 1. Submit a story
  const submissionId = await client.submitStory(
    'QmStoryHashOnIPFS...',
    'Commander Zara\'s Lost Years',
    1 // characterId
  )
  console.log('Submitted story:', submissionId)
  
  // 2. Check submission
  const submission = await client.getSubmission(submissionId)
  console.log('Submission:', submission)
  
  // 3. Create pool (owner only)
  const poolId = await client.createPool([1, 2, 3])
  console.log('Created pool:', poolId)
  
  // 4. Check odds
  const odds = await client.getAllOdds(poolId)
  console.log('Current odds:', odds)
  
  // 5. Place bet
  const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
  const betAmount = ethers.parseUnits('100', 6) // 100 USDC
  await client.placeBet(poolId, submissionId, betAmount, usdcAddress)
  console.log('Bet placed!')
  
  // 6. Check potential payout
  const payout = await client.calculatePayout(poolId, submissionId, betAmount)
  console.log('Potential payout:', ethers.formatUnits(payout, 6), 'USDC')
  
  // 7. Settle pool (owner only)
  const winnerId = await client.settlePool(
    poolId,
    [85, 78, 92], // AI scores
    [3000, 5500, 1500] // Community scores (30%, 55%, 15%)
  )
  console.log('Pool settled, winner:', winnerId)
  
  // 8. Claim winnings
  await client.claimWinnings(poolId)
  console.log('Winnings claimed!')
  
  // 9. Claim author earnings
  const earnings = await client.getAuthorEarnings(await wallet.getAddress())
  console.log('Author earnings:', ethers.formatUnits(earnings, 6), 'USDC')
  
  await client.claimEarnings()
  console.log('Earnings claimed!')
}

// ============================================================================
// EVENT LISTENERS EXAMPLE
// ============================================================================

export function setupEventListeners(client: FanFictionCanonClient) {
  // Listen for new submissions
  client.onSubmissionCreated((id, author, title) => {
    console.log(`New submission #${id} by ${author}: ${title}`)
  })
  
  // Listen for new pools
  client.onPoolCreated((poolId, submissionIds) => {
    console.log(`New pool #${poolId} with submissions:`, submissionIds)
  })
  
  // Listen for bets
  client.onBetPlaced((poolId, bettor, submissionId, amount) => {
    console.log(
      `Bet placed on pool #${poolId}, submission #${submissionId} by ${bettor}: ${amount}`
    )
  })
  
  // Listen for pool settlements
  client.onPoolSettled((poolId, winnerId, finalScore) => {
    console.log(
      `Pool #${poolId} settled! Winner: submission #${winnerId} (score: ${finalScore})`
    )
  })
}
