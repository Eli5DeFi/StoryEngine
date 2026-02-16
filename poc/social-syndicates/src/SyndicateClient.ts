import { ethers, Contract, Provider, Signer } from 'ethers'

// ABI (simplified - full ABI would be generated from contract)
const SYNDICATE_ABI = [
  'function createSyndicate(string name, uint256 minStake, uint256 maxMembers, uint256 votingThreshold, bool isPublic) returns (uint256)',
  'function joinSyndicate(uint256 syndicateId, uint256 amount)',
  'function leaveSyndicate(uint256 syndicateId)',
  'function addStake(uint256 syndicateId, uint256 amount)',
  'function proposeBet(uint256 syndicateId, uint256 amount, uint256[] outcomeIds, string reasoning) returns (uint256)',
  'function vote(uint256 proposalId, bool support)',
  'function executeBet(uint256 proposalId)',
  'function cancelProposal(uint256 proposalId)',
  'function claimRewards(uint256 syndicateId)',
  'function isMember(uint256 syndicateId, address user) view returns (bool)',
  'function getMembers(uint256 syndicateId) view returns (address[])',
  'function getMemberStake(uint256 syndicateId, address member) view returns (uint256)',
  'function getSyndicateStats(uint256 syndicateId) view returns (uint256, uint256, uint256, uint256, uint256)',
  'function getProposalOutcomes(uint256 proposalId) view returns (uint256[])',
  'event SyndicateCreated(uint256 indexed syndicateId, string name, address indexed creator, uint256 minStake, uint256 maxMembers)',
  'event MemberJoined(uint256 indexed syndicateId, address indexed member, uint256 amount)',
  'event ProposalCreated(uint256 indexed proposalId, uint256 indexed syndicateId, address indexed proposer, uint256 amount, uint256[] outcomeIds)',
  'event ProposalVoted(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower)',
  'event BetExecuted(uint256 indexed proposalId, uint256 indexed syndicateId, uint256 amount)',
  'event ProfitDistributed(uint256 indexed syndicateId, uint256 totalProfit, uint256 toMembers, uint256 toTreasury, uint256 toProposer)'
]

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
]

export interface Syndicate {
  id: number
  name: string
  creator: string
  members: string[]
  totalStake: bigint
  treasury: bigint
  minStake: bigint
  maxMembers: number
  votingThreshold: number
  isPublic: boolean
  totalProfit: bigint
  totalBets: number
  wins: number
  roi: number // Percentage (e.g., 287 = 287%)
  isActive: boolean
  createdAt: number
}

export interface BetProposal {
  id: number
  syndicateId: number
  proposer: string
  amount: bigint
  outcomeIds: number[]
  reasoning: string
  votesFor: number
  votesAgainst: number
  executed: boolean
  cancelled: boolean
  createdAt: number
  deadline: number
}

export interface MemberInfo {
  address: string
  stake: bigint
  votingPower: number // Percentage
  claimableRewards: bigint
  joinedAt: number
}

/**
 * TypeScript client for SyndicateBetting contract
 */
export class SyndicateClient {
  private contract: Contract
  private provider: Provider
  private signer?: Signer

  constructor(
    contractAddress: string,
    provider: Provider,
    signer?: Signer
  ) {
    this.provider = provider
    this.signer = signer

    this.contract = new Contract(
      contractAddress,
      SYNDICATE_ABI,
      signer || provider
    )
  }

  // ============================================================================
  // SYNDICATE MANAGEMENT
  // ============================================================================

  /**
   * Create a new betting syndicate
   */
  async createSyndicate(params: {
    name: string
    minStake: bigint // USDC (6 decimals)
    maxMembers: number
    votingThreshold: number // 0-100 (percentage)
    isPublic: boolean
  }): Promise<{ syndicateId: number; txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.createSyndicate(
      params.name,
      params.minStake,
      params.maxMembers,
      params.votingThreshold,
      params.isPublic
    )

    const receipt = await tx.wait()

    // Parse event to get syndicate ID
    const event = receipt.logs
      .map((log: any) => {
        try {
          return this.contract.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .find((e: any) => e?.name === 'SyndicateCreated')

    const syndicateId = Number(event?.args?.syndicateId)

    return {
      syndicateId,
      txHash: tx.hash
    }
  }

  /**
   * Join a syndicate by staking capital
   */
  async joinSyndicate(
    syndicateId: number,
    amount: bigint,
    usdcAddress: string
  ): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    // Approve USDC first
    const usdc = new Contract(usdcAddress, ERC20_ABI, this.signer)

    const allowance = await usdc.allowance(
      await this.signer.getAddress(),
      this.contract.target
    )

    if (allowance < amount) {
      const approveTx = await usdc.approve(this.contract.target, amount)
      await approveTx.wait()
    }

    // Join syndicate
    const tx = await this.contract.joinSyndicate(syndicateId, amount)
    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Leave a syndicate and withdraw stake
   */
  async leaveSyndicate(syndicateId: number): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.leaveSyndicate(syndicateId)
    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Add more stake to existing membership
   */
  async addStake(
    syndicateId: number,
    amount: bigint,
    usdcAddress: string
  ): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    // Approve USDC
    const usdc = new Contract(usdcAddress, ERC20_ABI, this.signer)
    const approveTx = await usdc.approve(this.contract.target, amount)
    await approveTx.wait()

    // Add stake
    const tx = await this.contract.addStake(syndicateId, amount)
    await tx.wait()

    return { txHash: tx.hash }
  }

  // ============================================================================
  // BET PROPOSALS & VOTING
  // ============================================================================

  /**
   * Propose a bet for the syndicate
   */
  async proposeBet(params: {
    syndicateId: number
    amount: bigint
    outcomeIds: number[]
    reasoning: string
  }): Promise<{ proposalId: number; txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.proposeBet(
      params.syndicateId,
      params.amount,
      params.outcomeIds,
      params.reasoning
    )

    const receipt = await tx.wait()

    const event = receipt.logs
      .map((log: any) => {
        try {
          return this.contract.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .find((e: any) => e?.name === 'ProposalCreated')

    const proposalId = Number(event?.args?.proposalId)

    return {
      proposalId,
      txHash: tx.hash
    }
  }

  /**
   * Vote on a bet proposal
   */
  async vote(
    proposalId: number,
    support: boolean
  ): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.vote(proposalId, support)
    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Execute a bet proposal
   */
  async executeBet(proposalId: number): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.executeBet(proposalId)
    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Cancel a proposal
   */
  async cancelProposal(proposalId: number): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.cancelProposal(proposalId)
    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Claim accumulated rewards
   */
  async claimRewards(syndicateId: number): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required')

    const tx = await this.contract.claimRewards(syndicateId)
    await tx.wait()

    return { txHash: tx.hash }
  }

  // ============================================================================
  // VIEW FUNCTIONS
  // ============================================================================

  /**
   * Check if address is member of syndicate
   */
  async isMember(syndicateId: number, address: string): Promise<boolean> {
    return await this.contract.isMember(syndicateId, address)
  }

  /**
   * Get syndicate members
   */
  async getMembers(syndicateId: number): Promise<string[]> {
    return await this.contract.getMembers(syndicateId)
  }

  /**
   * Get member stake amount
   */
  async getMemberStake(syndicateId: number, member: string): Promise<bigint> {
    return await this.contract.getMemberStake(syndicateId, member)
  }

  /**
   * Get syndicate stats
   */
  async getSyndicateStats(syndicateId: number): Promise<{
    totalStake: bigint
    treasury: bigint
    totalBets: number
    wins: number
    roi: number
  }> {
    const [totalStake, treasury, totalBets, wins, roiBP] =
      await this.contract.getSyndicateStats(syndicateId)

    return {
      totalStake,
      treasury,
      totalBets: Number(totalBets),
      wins: Number(wins),
      roi: Number(roiBP) / 100 // Convert basis points to percentage
    }
  }

  /**
   * Get proposal outcome IDs
   */
  async getProposalOutcomes(proposalId: number): Promise<number[]> {
    const outcomes = await this.contract.getProposalOutcomes(proposalId)
    return outcomes.map((id: bigint) => Number(id))
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Format USDC amount (6 decimals) to string
   */
  formatUSDC(amount: bigint): string {
    return Number(amount) / 1_000_000 + ' USDC'
  }

  /**
   * Parse USDC string to bigint
   */
  parseUSDC(amount: number): bigint {
    return BigInt(Math.floor(amount * 1_000_000))
  }

  /**
   * Calculate voting power for a member
   */
  calculateVotingPower(memberStake: bigint, totalStake: bigint): number {
    if (totalStake === 0n) return 0
    return Number((memberStake * 100n) / totalStake)
  }

  /**
   * Calculate potential payout for a parlay bet
   */
  calculatePotentialPayout(amount: bigint, odds: number[]): bigint {
    const combinedOdds = odds.reduce((acc, odd) => acc * odd, 1)
    return BigInt(Math.floor(Number(amount) * combinedOdds))
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  /**
   * Listen for new syndicates
   */
  onSyndicateCreated(
    callback: (syndicateId: number, name: string, creator: string) => void
  ) {
    this.contract.on(
      'SyndicateCreated',
      (syndicateId, name, creator, minStake, maxMembers) => {
        callback(Number(syndicateId), name, creator)
      }
    )
  }

  /**
   * Listen for new members
   */
  onMemberJoined(
    callback: (syndicateId: number, member: string, amount: bigint) => void
  ) {
    this.contract.on('MemberJoined', (syndicateId, member, amount) => {
      callback(Number(syndicateId), member, amount)
    })
  }

  /**
   * Listen for new proposals
   */
  onProposalCreated(
    callback: (
      proposalId: number,
      syndicateId: number,
      proposer: string,
      amount: bigint
    ) => void
  ) {
    this.contract.on(
      'ProposalCreated',
      (proposalId, syndicateId, proposer, amount, outcomeIds) => {
        callback(Number(proposalId), Number(syndicateId), proposer, amount)
      }
    )
  }

  /**
   * Listen for votes
   */
  onProposalVoted(
    callback: (
      proposalId: number,
      voter: string,
      support: boolean,
      votingPower: number
    ) => void
  ) {
    this.contract.on(
      'ProposalVoted',
      (proposalId, voter, support, votingPower) => {
        callback(Number(proposalId), voter, support, Number(votingPower))
      }
    )
  }

  /**
   * Listen for bet executions
   */
  onBetExecuted(
    callback: (proposalId: number, syndicateId: number, amount: bigint) => void
  ) {
    this.contract.on('BetExecuted', (proposalId, syndicateId, amount) => {
      callback(Number(proposalId), Number(syndicateId), amount)
    })
  }

  /**
   * Listen for profit distributions
   */
  onProfitDistributed(
    callback: (
      syndicateId: number,
      totalProfit: bigint,
      toMembers: bigint,
      toTreasury: bigint,
      toProposer: bigint
    ) => void
  ) {
    this.contract.on(
      'ProfitDistributed',
      (syndicateId, totalProfit, toMembers, toTreasury, toProposer) => {
        callback(
          Number(syndicateId),
          totalProfit,
          toMembers,
          toTreasury,
          toProposer
        )
      }
    )
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function example() {
  const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/YOUR_KEY')
  const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider)

  const client = new SyndicateClient(
    '0x...', // Contract address
    provider,
    signer
  )

  // Create syndicate
  const { syndicateId } = await client.createSyndicate({
    name: 'House Valdris Dominators',
    minStake: client.parseUSDC(100), // $100 minimum
    maxMembers: 50,
    votingThreshold: 60, // 60% approval required
    isPublic: true
  })

  console.log(`Syndicate created! ID: ${syndicateId}`)

  // Join syndicate
  await client.joinSyndicate(
    syndicateId,
    client.parseUSDC(500), // Stake $500
    '0x...' // USDC address
  )

  // Propose a bet
  const { proposalId } = await client.proposeBet({
    syndicateId,
    amount: client.parseUSDC(1000), // Bet $1,000
    outcomeIds: [1, 3, 7], // Parlay
    reasoning: 'Valdris always chooses diplomacy after betrayal'
  })

  // Vote on proposal
  await client.vote(proposalId, true) // Support

  // Listen for events
  client.onProposalVoted((proposalId, voter, support, votingPower) => {
    console.log(
      `Vote on Proposal ${proposalId}: ${voter} voted ${support ? 'FOR' : 'AGAINST'} (${votingPower}% power)`
    )
  })

  // Get syndicate stats
  const stats = await client.getSyndicateStats(syndicateId)
  console.log(`ROI: ${stats.roi}%`)
  console.log(`Wins: ${stats.wins}/${stats.totalBets}`)
}
