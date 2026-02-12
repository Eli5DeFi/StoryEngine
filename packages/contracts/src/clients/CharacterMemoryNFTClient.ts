/**
 * TypeScript client for CharacterMemoryNFT contract
 * 
 * Provides easy-to-use methods for:
 * - Minting NFTs
 * - Updating stats
 * - Awarding badges
 * - Querying character data
 */

import { ethers, Contract, Wallet, providers } from 'ethers'

// ============ TYPES ============

export enum Archetype {
  NONE = 0,
  STRATEGIST = 1,
  GAMBLER = 2,
  ORACLE = 3,
  CONTRARIAN = 4
}

export enum RiskLevel {
  CONSERVATIVE = 0,
  BALANCED = 1,
  AGGRESSIVE = 2
}

export enum Alignment {
  NEUTRAL = 0,
  ORDER = 1,
  CHAOS = 2
}

export enum BadgeRarity {
  COMMON = 0,
  RARE = 1,
  EPIC = 2,
  LEGENDARY = 3
}

export interface CharacterStats {
  totalBets: bigint
  totalWagered: bigint // USDC, 6 decimals
  totalWon: bigint
  winRate: number // 0-10000 (basis points)
  currentStreak: number
  longestStreak: number
  archetype: Archetype
  riskLevel: RiskLevel
  alignment: Alignment
  mintedAt: number
  lastUpdatedAt: number
}

export interface Badge {
  badgeId: string // bytes32 as hex string
  earnedAt: number
  chapterId: string
  rarity: BadgeRarity
}

export interface CharacterProfile {
  tokenId: number
  owner: string
  stats: CharacterStats
  badges: Badge[]
  metadataURI: string
}

// ============ ABI ============

const CHARACTER_MEMORY_NFT_ABI = [
  // Read functions
  "function walletToTokenId(address wallet) view returns (uint256)",
  "function characterStats(uint256 tokenId) view returns (tuple(uint64 totalBets, uint128 totalWagered, uint128 totalWon, uint16 winRate, uint16 currentStreak, uint16 longestStreak, uint8 archetype, uint8 riskLevel, uint8 alignment, uint64 mintedAt, uint64 lastUpdatedAt))",
  "function getBadges(uint256 tokenId) view returns (tuple(bytes32 badgeId, uint64 earnedAt, string chapterId, uint8 rarity)[])",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  
  // Write functions
  "function mint(address to) returns (uint256)",
  "function updateStats(uint256 tokenId, uint128 betAmount, bool won, uint128 payout)",
  "function awardBadge(uint256 tokenId, bytes32 badgeId, string chapterId, uint8 rarity)",
  "function burn(uint256 tokenId)",
  
  // Admin
  "function setAuthorizedUpdater(address updater, bool authorized)",
  "function setBaseURI(string baseURI)",
  
  // Events
  "event CharacterMinted(address indexed owner, uint256 indexed tokenId, uint64 timestamp)",
  "event CharacterEvolved(uint256 indexed tokenId, uint8 newArchetype, uint8 newRiskLevel, uint8 newAlignment, string newMetadataURI)",
  "event BadgeEarned(uint256 indexed tokenId, bytes32 indexed badgeId, string chapterId, uint8 rarity, uint64 timestamp)",
  "event StatsUpdated(uint256 indexed tokenId, uint64 totalBets, uint128 totalWagered, uint128 totalWon, uint16 winRate, uint16 currentStreak)"
]

// ============ CLIENT ============

export class CharacterMemoryNFTClient {
  private contract: Contract
  private provider: providers.Provider
  private signer?: Wallet
  
  constructor(
    contractAddress: string,
    provider: providers.Provider,
    privateKey?: string
  ) {
    this.provider = provider
    
    if (privateKey) {
      this.signer = new Wallet(privateKey, provider)
      this.contract = new Contract(contractAddress, CHARACTER_MEMORY_NFT_ABI, this.signer)
    } else {
      this.contract = new Contract(contractAddress, CHARACTER_MEMORY_NFT_ABI, provider)
    }
  }
  
  // ============ READ METHODS ============
  
  /**
   * Get token ID for a wallet address
   * @param walletAddress Wallet address
   * @returns Token ID (0 if not minted)
   */
  async getTokenByWallet(walletAddress: string): Promise<number> {
    const tokenId = await this.contract.walletToTokenId(walletAddress)
    return Number(tokenId)
  }
  
  /**
   * Check if a wallet has minted an NFT
   * @param walletAddress Wallet address
   * @returns True if minted
   */
  async hasMinted(walletAddress: string): Promise<boolean> {
    const tokenId = await this.getTokenByWallet(walletAddress)
    return tokenId > 0
  }
  
  /**
   * Get character stats for a token
   * @param tokenId Token ID
   * @returns Character stats
   */
  async getStats(tokenId: number): Promise<CharacterStats> {
    const stats = await this.contract.characterStats(tokenId)
    
    return {
      totalBets: BigInt(stats.totalBets),
      totalWagered: BigInt(stats.totalWagered),
      totalWon: BigInt(stats.totalWon),
      winRate: Number(stats.winRate),
      currentStreak: Number(stats.currentStreak),
      longestStreak: Number(stats.longestStreak),
      archetype: Number(stats.archetype) as Archetype,
      riskLevel: Number(stats.riskLevel) as RiskLevel,
      alignment: Number(stats.alignment) as Alignment,
      mintedAt: Number(stats.mintedAt),
      lastUpdatedAt: Number(stats.lastUpdatedAt)
    }
  }
  
  /**
   * Get all badges for a token
   * @param tokenId Token ID
   * @returns Array of badges
   */
  async getBadges(tokenId: number): Promise<Badge[]> {
    const badges = await this.contract.getBadges(tokenId)
    
    return badges.map((b: any) => ({
      badgeId: b.badgeId,
      earnedAt: Number(b.earnedAt),
      chapterId: b.chapterId,
      rarity: Number(b.rarity) as BadgeRarity
    }))
  }
  
  /**
   * Get full character profile
   * @param tokenId Token ID
   * @returns Complete character profile
   */
  async getProfile(tokenId: number): Promise<CharacterProfile> {
    const [owner, stats, badges, metadataURI] = await Promise.all([
      this.contract.ownerOf(tokenId),
      this.getStats(tokenId),
      this.getBadges(tokenId),
      this.contract.tokenURI(tokenId)
    ])
    
    return {
      tokenId,
      owner,
      stats,
      badges,
      metadataURI
    }
  }
  
  /**
   * Get character profile by wallet address
   * @param walletAddress Wallet address
   * @returns Character profile or null if not minted
   */
  async getProfileByWallet(walletAddress: string): Promise<CharacterProfile | null> {
    const tokenId = await this.getTokenByWallet(walletAddress)
    if (tokenId === 0) return null
    
    return this.getProfile(tokenId)
  }
  
  // ============ WRITE METHODS ============
  
  /**
   * Mint a new Character Memory NFT
   * @param toAddress Address to mint to
   * @returns Transaction receipt with token ID
   */
  async mint(toAddress: string): Promise<{
    tokenId: number
    txHash: string
    gasUsed: bigint
  }> {
    if (!this.signer) {
      throw new Error('Signer required for minting')
    }
    
    // Check if already minted
    const existing = await this.getTokenByWallet(toAddress)
    if (existing > 0) {
      throw new Error(`Wallet ${toAddress} already has token ${existing}`)
    }
    
    const tx = await this.contract.mint(toAddress)
    const receipt = await tx.wait()
    
    // Extract token ID from CharacterMinted event
    const event = receipt.events?.find((e: any) => e.event === 'CharacterMinted')
    const tokenId = event ? Number(event.args?.tokenId) : 0
    
    return {
      tokenId,
      txHash: receipt.transactionHash,
      gasUsed: BigInt(receipt.gasUsed.toString())
    }
  }
  
  /**
   * Update character stats after a bet
   * @param tokenId Token ID
   * @param betAmount Bet amount in USDC (6 decimals)
   * @param won Whether the bet won
   * @param payout Payout amount (if won)
   * @returns Transaction receipt
   */
  async updateStats(
    tokenId: number,
    betAmount: bigint,
    won: boolean,
    payout: bigint = 0n
  ): Promise<{
    evolved: boolean
    newArchetype?: Archetype
    newRiskLevel?: RiskLevel
    newAlignment?: Alignment
    txHash: string
    gasUsed: bigint
  }> {
    if (!this.signer) {
      throw new Error('Signer required for updating stats')
    }
    
    const tx = await this.contract.updateStats(tokenId, betAmount, won, payout)
    const receipt = await tx.wait()
    
    // Check for evolution event
    const evolveEvent = receipt.events?.find((e: any) => e.event === 'CharacterEvolved')
    
    if (evolveEvent) {
      return {
        evolved: true,
        newArchetype: Number(evolveEvent.args?.newArchetype) as Archetype,
        newRiskLevel: Number(evolveEvent.args?.newRiskLevel) as RiskLevel,
        newAlignment: Number(evolveEvent.args?.newAlignment) as Alignment,
        txHash: receipt.transactionHash,
        gasUsed: BigInt(receipt.gasUsed.toString())
      }
    }
    
    return {
      evolved: false,
      txHash: receipt.transactionHash,
      gasUsed: BigInt(receipt.gasUsed.toString())
    }
  }
  
  /**
   * Award a badge to a character
   * @param tokenId Token ID
   * @param badgeName Human-readable badge name
   * @param chapterId Chapter where earned
   * @param rarity Badge rarity
   * @returns Transaction receipt
   */
  async awardBadge(
    tokenId: number,
    badgeName: string,
    chapterId: string,
    rarity: BadgeRarity
  ): Promise<{
    badgeId: string
    txHash: string
    gasUsed: bigint
  }> {
    if (!this.signer) {
      throw new Error('Signer required for awarding badges')
    }
    
    // Generate badge ID from name (keccak256)
    const badgeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(badgeName))
    
    const tx = await this.contract.awardBadge(tokenId, badgeId, chapterId, rarity)
    const receipt = await tx.wait()
    
    return {
      badgeId,
      txHash: receipt.transactionHash,
      gasUsed: BigInt(receipt.gasUsed.toString())
    }
  }
  
  /**
   * Burn (destroy) an NFT
   * @param tokenId Token ID to burn
   * @returns Transaction hash
   */
  async burn(tokenId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for burning')
    }
    
    const tx = await this.contract.burn(tokenId)
    const receipt = await tx.wait()
    
    return receipt.transactionHash
  }
  
  // ============ UTILITY METHODS ============
  
  /**
   * Convert USDC amount to 6-decimal format
   * @param amount Amount in dollars (e.g., 10.50)
   * @returns BigInt with 6 decimals
   */
  static usdcToWei(amount: number): bigint {
    return BigInt(Math.floor(amount * 1_000_000))
  }
  
  /**
   * Convert 6-decimal USDC to dollars
   * @param wei Amount in 6-decimal format
   * @returns Dollars (e.g., 10.50)
   */
  static weiToUsdc(wei: bigint): number {
    return Number(wei) / 1_000_000
  }
  
  /**
   * Format win rate from basis points to percentage
   * @param winRate Win rate in basis points (0-10000)
   * @returns Percentage string (e.g., "75.5%")
   */
  static formatWinRate(winRate: number): string {
    return `${(winRate / 100).toFixed(1)}%`
  }
  
  /**
   * Get archetype name
   * @param archetype Archetype enum
   * @returns Human-readable name
   */
  static getArchetypeName(archetype: Archetype): string {
    const names = {
      [Archetype.NONE]: 'Novice',
      [Archetype.STRATEGIST]: 'Strategist',
      [Archetype.GAMBLER]: 'Gambler',
      [Archetype.ORACLE]: 'Oracle',
      [Archetype.CONTRARIAN]: 'Contrarian'
    }
    return names[archetype]
  }
  
  /**
   * Get risk level name
   * @param riskLevel RiskLevel enum
   * @returns Human-readable name
   */
  static getRiskLevelName(riskLevel: RiskLevel): string {
    const names = {
      [RiskLevel.CONSERVATIVE]: 'Conservative',
      [RiskLevel.BALANCED]: 'Balanced',
      [RiskLevel.AGGRESSIVE]: 'Aggressive'
    }
    return names[riskLevel]
  }
  
  /**
   * Get alignment name
   * @param alignment Alignment enum
   * @returns Human-readable name
   */
  static getAlignmentName(alignment: Alignment): string {
    const names = {
      [Alignment.NEUTRAL]: 'Neutral',
      [Alignment.ORDER]: 'Order',
      [Alignment.CHAOS]: 'Chaos'
    }
    return names[alignment]
  }
  
  /**
   * Get badge rarity name
   * @param rarity BadgeRarity enum
   * @returns Human-readable name
   */
  static getBadgeRarityName(rarity: BadgeRarity): string {
    const names = {
      [BadgeRarity.COMMON]: 'Common',
      [BadgeRarity.RARE]: 'Rare',
      [BadgeRarity.EPIC]: 'Epic',
      [BadgeRarity.LEGENDARY]: 'Legendary'
    }
    return names[rarity]
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Listen for minting events
   * @param callback Function to call on mint
   */
  onMint(callback: (owner: string, tokenId: number, timestamp: number) => void): void {
    this.contract.on('CharacterMinted', (owner, tokenId, timestamp) => {
      callback(owner, Number(tokenId), Number(timestamp))
    })
  }
  
  /**
   * Listen for evolution events
   * @param callback Function to call on evolution
   */
  onEvolution(callback: (
    tokenId: number,
    archetype: Archetype,
    riskLevel: RiskLevel,
    alignment: Alignment
  ) => void): void {
    this.contract.on('CharacterEvolved', (tokenId, archetype, riskLevel, alignment) => {
      callback(
        Number(tokenId),
        Number(archetype) as Archetype,
        Number(riskLevel) as RiskLevel,
        Number(alignment) as Alignment
      )
    })
  }
  
  /**
   * Listen for badge events
   * @param callback Function to call on badge earned
   */
  onBadgeEarned(callback: (
    tokenId: number,
    badgeId: string,
    chapterId: string,
    rarity: BadgeRarity,
    timestamp: number
  ) => void): void {
    this.contract.on('BadgeEarned', (tokenId, badgeId, chapterId, rarity, timestamp) => {
      callback(
        Number(tokenId),
        badgeId,
        chapterId,
        Number(rarity) as BadgeRarity,
        Number(timestamp)
      )
    })
  }
}

// ============ EXAMPLE USAGE ============

/**
 * Example: Mint and track character evolution
 */
export async function exampleUsage() {
  // Initialize client (read-only)
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org')
  const client = new CharacterMemoryNFTClient(
    '0x...', // Contract address
    provider
  )
  
  // Check if wallet has NFT
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  const hasNFT = await client.hasMinted(walletAddress)
  
  if (hasNFT) {
    // Get profile
    const profile = await client.getProfileByWallet(walletAddress)
    console.log('Character Profile:', profile)
    
    // Format stats
    console.log('Stats:')
    console.log(`- Total Bets: ${profile!.stats.totalBets}`)
    console.log(`- Total Wagered: $${CharacterMemoryNFTClient.weiToUsdc(profile!.stats.totalWagered)}`)
    console.log(`- Win Rate: ${CharacterMemoryNFTClient.formatWinRate(profile!.stats.winRate)}`)
    console.log(`- Archetype: ${CharacterMemoryNFTClient.getArchetypeName(profile!.stats.archetype)}`)
    console.log(`- Risk Level: ${CharacterMemoryNFTClient.getRiskLevelName(profile!.stats.riskLevel)}`)
    console.log(`- Alignment: ${CharacterMemoryNFTClient.getAlignmentName(profile!.stats.alignment)}`)
    
    // Show badges
    console.log(`\nBadges (${profile!.badges.length}):`)
    profile!.badges.forEach(badge => {
      console.log(`- ${badge.chapterId}: ${CharacterMemoryNFTClient.getBadgeRarityName(badge.rarity)}`)
    })
  } else {
    console.log('No NFT minted for this wallet')
  }
  
  // Listen for evolution events
  client.onEvolution((tokenId, archetype, riskLevel, alignment) => {
    console.log(`\n🎉 Character ${tokenId} evolved!`)
    console.log(`New Archetype: ${CharacterMemoryNFTClient.getArchetypeName(archetype)}`)
    console.log(`New Risk Level: ${CharacterMemoryNFTClient.getRiskLevelName(riskLevel)}`)
    console.log(`New Alignment: ${CharacterMemoryNFTClient.getAlignmentName(alignment)}`)
  })
}
