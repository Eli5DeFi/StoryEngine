/**
 * Narrative Guilds & Faction Wars Engine
 *
 * Innovation Cycle #52 — "The Faction War Engine"
 *
 * Transforms Voidborne from individual betting into organized faction warfare.
 * Players form Guilds aligned to story Houses. Guilds bet collectively, control
 * territory on the Void Map, and earn actual narrative influence — the top-ranked
 * Guild each month gets to inject a "House Agenda" into Claude's chapter prompt.
 *
 * Architecture:
 *   GuildRegistry         — Create / join / manage guilds
 *   GuildTreasury         — Collective betting + yield distribution
 *   FactionWarEngine      — War declaration, resolution, trophy NFTs
 *   VoidMapController     — Territory claiming, sector yield
 *   AgendaInjector        — Winner injects narrative agenda into AI prompt
 *   GuildLeaderboard      — Monthly scoring + ranking
 *
 * @module guild-faction-engine
 */

import Anthropic from '@anthropic-ai/sdk'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HouseAlignment =
  | 'valdris'      // House Valdris — honor, military, silver threads
  | 'obsidian'     // House Obsidian — shadow, espionage, null threads
  | 'aurelius'     // House Aurelius — commerce, negotiation, gold threads
  | 'strand'       // The Grand Strand — ancient law, cosmic order, all threads
  | 'null'         // Null Collective — chaos, Void worship, broken threads

export type GuildTier = 'ember' | 'iron' | 'silver' | 'gold' | 'void'

export interface Guild {
  id: string
  name: string
  tag: string                    // 3-5 char tag e.g. [VLD]
  description: string
  house: HouseAlignment
  founderId: string
  members: GuildMember[]
  treasury: GuildTreasury
  territory: SectorControl[]
  warHistory: FactionWar[]
  tier: GuildTier
  score: number                  // Monthly score (resets monthly)
  totalScore: number             // All-time score
  agendaSlots: AgendaSlot[]     // Narrative agenda history
  createdAt: Date
  registrationTx?: string
}

export interface GuildMember {
  walletAddress: string
  username: string
  role: 'leader' | 'officer' | 'member'
  contributedUSDC: number
  betsWon: number
  betsLost: number
  joinedAt: Date
  shareWeight: number            // % of treasury yields
}

export interface GuildTreasury {
  balanceUSDC: number
  totalDeposited: number
  totalWon: number
  totalLost: number
  pendingYield: number
  lastDistributionAt?: Date
  bets: GuildBet[]
}

export interface GuildBet {
  id: string
  chapterId: string
  choiceId: string
  amountUSDC: number
  placedAt: Date
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  payoutUSDC?: number
  voteBreakdown: Record<string, number>  // memberId → vote weight
}

export interface SectorControl {
  sectorId: string
  sectorName: string             // e.g., "The Void Gate Approach", "Strand Archive"
  storyArc: string               // Which story arc this sector covers
  controlledSince: Date
  passiveYieldRate: number       // % of sector betting fees
  earnedUSDC: number
  lastClaimedAt: Date
}

export interface FactionWar {
  id: string
  challengerId: string
  defenderId: string
  sectorId: string
  startedAtChapter: number
  endsAtChapter: number
  challengerScore: number
  defenderScore: number
  status: 'active' | 'challenger_won' | 'defender_won' | 'draw'
  trophyNFT?: WarTrophyNFT
  resolvedAt?: Date
}

export interface WarTrophyNFT {
  tokenId: string
  winnerId: string
  sectorId: string
  warId: string
  mintedAt: Date
  imageUri: string
  metadata: Record<string, unknown>
}

export interface AgendaSlot {
  chapterId: string
  guildId: string
  agendaText: string             // Injected into Claude prompt
  proposedBy: string             // Member who submitted agenda
  approvedByVote: boolean
  narrativeImpact?: string       // Claude's interpretation of agenda
  usedAt: Date
}

export interface VoidMapSector {
  id: string
  name: string
  storyArc: string
  controllingGuild?: string
  contestedBy?: string[]
  totalBettingVolume: number
  yieldRate: number
  loreDescription: string
  coordinates: { x: number; y: number }
}

export interface GuildWarDeclaration {
  challengerGuildId: string
  defenderGuildId: string
  sectorId: string
  wagerUSDC: number
  reason: string
  startChapter: number
  durationChapters: number
}

export interface GuildScore {
  guildId: string
  guildName: string
  house: HouseAlignment
  tier: GuildTier
  monthlyScore: number
  winRate: number
  territory: number
  membersActive: number
  rank: number
}

export interface AgendaProposal {
  guildId: string
  chapterId: string
  agendaText: string
  proposedBy: string
  votes: Record<string, boolean>   // memberId → approve
}

export interface FactionWarResult {
  war: FactionWar
  winner: 'challenger' | 'defender' | 'draw'
  scoreDelta: number
  territoryTransfer: SectorControl | null
  trophyMinted: boolean
  narrativeConsequence: string
}

// ─── Void Map Sectors (canonical story geography) ─────────────────────────────

const VOID_MAP_SECTORS: VoidMapSector[] = [
  {
    id: 'sector-001',
    name: 'The Silent Throne Antechamber',
    storyArc: 'Act 1: The Succession',
    yieldRate: 0.008,
    totalBettingVolume: 0,
    loreDescription: 'The outer hall where petitioners wait before the Throne. Control here means first knowledge of the Heir\'s movements.',
    coordinates: { x: 50, y: 20 },
  },
  {
    id: 'sector-002',
    name: 'Obsidian Veil Waystation',
    storyArc: 'Act 1: The Succession',
    controllingGuild: undefined,
    yieldRate: 0.006,
    totalBettingVolume: 0,
    loreDescription: 'The shadow-market where House Obsidian brokers its intelligence. Controlling this sector gives access to hidden chapter hints.',
    coordinates: { x: 15, y: 45 },
  },
  {
    id: 'sector-003',
    name: 'The Void Gate Approach',
    storyArc: 'Act 2: The Stitching Crisis',
    yieldRate: 0.012,
    totalBettingVolume: 0,
    loreDescription: 'The threshold between known space and the unmapped Void. Highest-yield sector. Contested by all factions.',
    coordinates: { x: 80, y: 60 },
  },
  {
    id: 'sector-004',
    name: 'Aurelius Mercantile Nexus',
    storyArc: 'Act 1: The Succession',
    yieldRate: 0.005,
    totalBettingVolume: 0,
    loreDescription: 'The trade hub where fortunes change hands. Controlling this sector gives bonus yield from high-volume betting chapters.',
    coordinates: { x: 40, y: 70 },
  },
  {
    id: 'sector-005',
    name: 'Grand Strand Archive',
    storyArc: 'Act 2: The Stitching Crisis',
    yieldRate: 0.010,
    totalBettingVolume: 0,
    loreDescription: 'The ancient repository of Thread lore. The controlling Guild can request one lore expansion per month.',
    coordinates: { x: 60, y: 40 },
  },
  {
    id: 'sector-006',
    name: 'Null Collective Breach Point',
    storyArc: 'Act 3: The Unraveling',
    yieldRate: 0.015,
    totalBettingVolume: 0,
    loreDescription: 'The fracture where reality frays. Highest risk, highest yield. Controlling Guild earns double yield but risks Void corruption narrative events.',
    coordinates: { x: 90, y: 85 },
  },
]

// ─── Scoring Weights ──────────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  WIN: 100,
  LOSS: -20,
  TERRITORY_HELD_PER_CHAPTER: 15,
  WAR_WIN: 500,
  WAR_LOSS: -100,
  HIGH_ACCURACY_BONUS: 50,    // Win rate > 65%
  MEMBER_RECRUITED: 10,
}

const TIER_THRESHOLDS: Record<GuildTier, number> = {
  ember: 0,
  iron: 1_000,
  silver: 5_000,
  gold: 20_000,
  void: 100_000,
}

// ─── GuildRegistry ─────────────────────────────────────────────────────────────

export class GuildRegistry {
  private guilds: Map<string, Guild> = new Map()
  private memberIndex: Map<string, string> = new Map()  // walletAddress → guildId

  /**
   * Create a new guild. Costs 2 USDC (handled off-chain, tx hash recorded).
   */
  createGuild(params: {
    name: string
    tag: string
    description: string
    house: HouseAlignment
    founderAddress: string
    founderUsername: string
    registrationTx: string
  }): Guild {
    if (this.memberIndex.has(params.founderAddress)) {
      throw new Error(`${params.founderAddress} is already in a guild`)
    }
    if (params.tag.length < 2 || params.tag.length > 5) {
      throw new Error('Guild tag must be 2-5 characters')
    }
    // Ensure tag uniqueness
    for (const g of this.guilds.values()) {
      if (g.tag.toUpperCase() === params.tag.toUpperCase()) {
        throw new Error(`Tag [${params.tag}] already taken`)
      }
    }

    const id = `guild-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const founder: GuildMember = {
      walletAddress: params.founderAddress,
      username: params.founderUsername,
      role: 'leader',
      contributedUSDC: 0,
      betsWon: 0,
      betsLost: 0,
      joinedAt: new Date(),
      shareWeight: 1.0,
    }

    const guild: Guild = {
      id,
      name: params.name,
      tag: params.tag.toUpperCase(),
      description: params.description,
      house: params.house,
      founderId: params.founderAddress,
      members: [founder],
      treasury: {
        balanceUSDC: 0,
        totalDeposited: 0,
        totalWon: 0,
        totalLost: 0,
        pendingYield: 0,
        bets: [],
      },
      territory: [],
      warHistory: [],
      tier: 'ember',
      score: 0,
      totalScore: 0,
      agendaSlots: [],
      createdAt: new Date(),
      registrationTx: params.registrationTx,
    }

    this.guilds.set(id, guild)
    this.memberIndex.set(params.founderAddress, id)
    return guild
  }

  /**
   * Join an existing guild (max 50 members).
   */
  joinGuild(params: {
    guildId: string
    walletAddress: string
    username: string
    invitedBy?: string
  }): GuildMember {
    if (this.memberIndex.has(params.walletAddress)) {
      throw new Error('Already in a guild. Leave current guild first.')
    }

    const guild = this.getGuild(params.guildId)
    if (guild.members.length >= 50) {
      throw new Error('Guild is full (max 50 members)')
    }

    const member: GuildMember = {
      walletAddress: params.walletAddress,
      username: params.username,
      role: 'member',
      contributedUSDC: 0,
      betsWon: 0,
      betsLost: 0,
      joinedAt: new Date(),
      shareWeight: 0.8,    // New members earn 80% of leader share
    }

    guild.members.push(member)
    this.memberIndex.set(params.walletAddress, guild.id)

    // Score for recruiting
    guild.score += SCORE_WEIGHTS.MEMBER_RECRUITED

    return member
  }

  getGuild(id: string): Guild {
    const g = this.guilds.get(id)
    if (!g) throw new Error(`Guild ${id} not found`)
    return g
  }

  getGuildByMember(walletAddress: string): Guild | null {
    const guildId = this.memberIndex.get(walletAddress)
    return guildId ? this.guilds.get(guildId) ?? null : null
  }

  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values())
  }

  getGuildsByHouse(house: HouseAlignment): Guild[] {
    return this.getAllGuilds().filter(g => g.house === house)
  }

  /**
   * Recalculate tier based on total score.
   */
  recalculateTier(guildId: string): GuildTier {
    const guild = this.getGuild(guildId)
    let tier: GuildTier = 'ember'
    for (const [t, threshold] of Object.entries(TIER_THRESHOLDS)) {
      if (guild.totalScore >= threshold) {
        tier = t as GuildTier
      }
    }
    guild.tier = tier
    return tier
  }
}

// ─── GuildTreasuryManager ─────────────────────────────────────────────────────

export class GuildTreasuryManager {
  constructor(private registry: GuildRegistry) {}

  /**
   * Member deposits USDC into guild treasury.
   */
  deposit(params: {
    guildId: string
    memberAddress: string
    amountUSDC: number
  }): void {
    const guild = this.registry.getGuild(params.guildId)
    const member = guild.members.find(m => m.walletAddress === params.memberAddress)
    if (!member) throw new Error('Not a guild member')

    guild.treasury.balanceUSDC += params.amountUSDC
    guild.treasury.totalDeposited += params.amountUSDC
    member.contributedUSDC += params.amountUSDC

    // Update share weight proportionally
    this.recalculateShares(guild)
  }

  /**
   * Officers vote to place a collective bet from treasury.
   */
  proposeBet(params: {
    guildId: string
    chapterId: string
    choiceId: string
    amountUSDC: number
    proposedBy: string
    voteWeights: Record<string, number>
  }): GuildBet {
    const guild = this.registry.getGuild(params.guildId)

    if (guild.treasury.balanceUSDC < params.amountUSDC) {
      throw new Error(`Insufficient treasury balance: ${guild.treasury.balanceUSDC} USDC`)
    }

    const bet: GuildBet = {
      id: `gbet-${Date.now()}`,
      chapterId: params.chapterId,
      choiceId: params.choiceId,
      amountUSDC: params.amountUSDC,
      placedAt: new Date(),
      status: 'pending',
      voteBreakdown: params.voteWeights,
    }

    guild.treasury.balanceUSDC -= params.amountUSDC
    guild.treasury.bets.push(bet)
    return bet
  }

  /**
   * Resolve a bet outcome (called by oracle/platform).
   */
  resolveBet(params: {
    guildId: string
    betId: string
    won: boolean
    payoutUSDC: number
    winnerChoiceId: string
  }): void {
    const guild = this.registry.getGuild(params.guildId)
    const bet = guild.treasury.bets.find(b => b.id === params.betId)
    if (!bet) throw new Error(`Bet ${params.betId} not found`)

    bet.status = params.won ? 'won' : 'lost'

    if (params.won) {
      bet.payoutUSDC = params.payoutUSDC
      guild.treasury.totalWon += params.payoutUSDC
      guild.treasury.pendingYield += params.payoutUSDC
      guild.score += SCORE_WEIGHTS.WIN
      guild.totalScore += SCORE_WEIGHTS.WIN

      // Update member win counts (those who voted for winning choice)
      for (const [memberId, weight] of Object.entries(bet.voteBreakdown)) {
        if (weight > 0) {
          const m = guild.members.find(mem => mem.walletAddress === memberId)
          if (m) m.betsWon++
        }
      }
    } else {
      guild.treasury.totalLost += bet.amountUSDC
      guild.score += SCORE_WEIGHTS.LOSS
      guild.totalScore += SCORE_WEIGHTS.LOSS

      for (const [memberId] of Object.entries(bet.voteBreakdown)) {
        const m = guild.members.find(mem => mem.walletAddress === memberId)
        if (m) m.betsLost++
      }
    }

    // Check high accuracy bonus
    const winRate = this.calculateGuildWinRate(guild)
    if (winRate > 0.65 && params.won) {
      guild.score += SCORE_WEIGHTS.HIGH_ACCURACY_BONUS
    }

    this.registry.recalculateTier(guild.id)
  }

  /**
   * Distribute pending treasury yield to members.
   * 70% members (weighted by share), 20% treasury reserve, 10% leader.
   */
  distributeYield(guildId: string): Record<string, number> {
    const guild = this.registry.getGuild(guildId)
    const pending = guild.treasury.pendingYield

    if (pending <= 0) return {}

    const memberShare = pending * 0.70
    const treasuryShare = pending * 0.20
    const leaderShare = pending * 0.10

    // Distribute to leader
    const leader = guild.members.find(m => m.role === 'leader')
    const distribution: Record<string, number> = {}

    if (leader) {
      distribution[leader.walletAddress] = leaderShare
    }

    // Distribute member share by weight
    const totalWeight = guild.members
      .filter(m => m.role !== 'leader')
      .reduce((sum, m) => sum + m.shareWeight, 0)

    for (const member of guild.members.filter(m => m.role !== 'leader')) {
      const share = totalWeight > 0
        ? (member.shareWeight / totalWeight) * memberShare
        : 0
      distribution[member.walletAddress] = (distribution[member.walletAddress] ?? 0) + share
    }

    // Retain treasury share
    guild.treasury.balanceUSDC += treasuryShare
    guild.treasury.pendingYield = 0
    guild.treasury.lastDistributionAt = new Date()

    return distribution
  }

  private recalculateShares(guild: Guild): void {
    const totalContributed = guild.members.reduce((s, m) => s + m.contributedUSDC, 0)
    if (totalContributed === 0) return

    for (const member of guild.members) {
      member.shareWeight = member.role === 'leader'
        ? Math.max(1.2, member.contributedUSDC / totalContributed * guild.members.length)
        : Math.max(0.5, member.contributedUSDC / totalContributed * guild.members.length)
    }
  }

  private calculateGuildWinRate(guild: Guild): number {
    const settled = guild.treasury.bets.filter(b => b.status !== 'pending')
    if (settled.length === 0) return 0
    return settled.filter(b => b.status === 'won').length / settled.length
  }
}

// ─── VoidMapController ─────────────────────────────────────────────────────────

export class VoidMapController {
  private sectors: Map<string, VoidMapSector>
  private sectorWins: Map<string, Map<string, number>>  // sectorId → (guildId → wins)

  constructor() {
    this.sectors = new Map(VOID_MAP_SECTORS.map(s => [s.id, { ...s }]))
    this.sectorWins = new Map()
  }

  /**
   * Record a guild bet win for a sector (called after bet resolution).
   * The guild with the most wins in a sector controls it.
   */
  recordSectorWin(sectorId: string, guildId: string): void {
    if (!this.sectorWins.has(sectorId)) {
      this.sectorWins.set(sectorId, new Map())
    }
    const sectorMap = this.sectorWins.get(sectorId)!
    sectorMap.set(guildId, (sectorMap.get(guildId) ?? 0) + 1)

    // Recompute controller
    this.recomputeController(sectorId)
  }

  private recomputeController(sectorId: string): void {
    const sector = this.sectors.get(sectorId)
    if (!sector) return

    const wins = this.sectorWins.get(sectorId)
    if (!wins) return

    let maxWins = 0
    let controller: string | undefined
    let contested = false

    for (const [guildId, count] of wins.entries()) {
      if (count > maxWins) {
        maxWins = count
        controller = guildId
        contested = false
      } else if (count === maxWins) {
        contested = true
      }
    }

    if (contested) {
      sector.contestedBy = Array.from(wins.entries())
        .filter(([, c]) => c === maxWins)
        .map(([id]) => id)
      sector.controllingGuild = undefined
    } else {
      sector.controllingGuild = controller
      sector.contestedBy = undefined
    }
  }

  /**
   * Get all sectors with current control state.
   */
  getVoidMap(): VoidMapSector[] {
    return Array.from(this.sectors.values())
  }

  /**
   * Get sectors controlled by a specific guild.
   */
  getGuildTerritory(guildId: string): VoidMapSector[] {
    return Array.from(this.sectors.values()).filter(s => s.controllingGuild === guildId)
  }

  /**
   * Calculate total passive yield for a guild based on territory.
   * @param totalChapterBettingVolume - USDC total bet in this chapter
   */
  calculateTerritoryYield(guildId: string, totalChapterBettingVolume: number): number {
    const territory = this.getGuildTerritory(guildId)
    return territory.reduce((sum, sector) => {
      const sectorVolume = totalChapterBettingVolume * 0.15   // Approximate per-sector share
      return sum + sectorVolume * sector.yieldRate
    }, 0)
  }

  /**
   * Generate Void Map SVG for frontend rendering.
   */
  generateVoidMapSVG(highlightGuildId?: string): string {
    const sectors = this.getVoidMap()
    const nodes = sectors.map(s => {
      const isHighlighted = s.controllingGuild === highlightGuildId
      const fill = s.controllingGuild
        ? (isHighlighted ? '#7c3aed' : '#374151')
        : (s.contestedBy ? '#d97706' : '#111827')
      const stroke = isHighlighted ? '#a78bfa' : '#6b7280'

      return `
        <g class="sector" data-id="${s.id}">
          <circle cx="${s.coordinates.x * 8}" cy="${s.coordinates.y * 8}" r="18"
            fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <text x="${s.coordinates.x * 8}" y="${s.coordinates.y * 8 + 5}"
            text-anchor="middle" font-size="8" fill="#e5e7eb">
            ${s.name.split(' ').slice(-1)[0]}
          </text>
          ${s.controllingGuild ? `<text x="${s.coordinates.x * 8}" y="${s.coordinates.y * 8 - 22}"
            text-anchor="middle" font-size="6" fill="#a78bfa">[CTRL]</text>` : ''}
        </g>`
    }).join('\n')

    return `<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"
      style="background:#030712;border:1px solid #1f2937">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      ${nodes}
    </svg>`
  }
}

// ─── FactionWarEngine ─────────────────────────────────────────────────────────

export class FactionWarEngine {
  private activeWars: Map<string, FactionWar> = new Map()

  /**
   * Declare war between two guilds over a sector.
   * Requires: guilds are both top-2 bettors in the same sector.
   */
  declareWar(
    declaration: GuildWarDeclaration,
    registry: GuildRegistry,
  ): FactionWar {
    const challenger = registry.getGuild(declaration.challengerGuildId)
    const defender = registry.getGuild(declaration.defenderGuildId)

    if (challenger.house === defender.house) {
      throw new Error('Cannot declare war on a guild of the same House. Seek diplomacy.')
    }

    // Check for existing war between these guilds
    for (const war of this.activeWars.values()) {
      if (
        war.status === 'active' &&
        ((war.challengerId === declaration.challengerGuildId && war.defenderId === declaration.defenderGuildId) ||
         (war.challengerId === declaration.defenderGuildId && war.defenderId === declaration.challengerGuildId))
      ) {
        throw new Error('War already active between these guilds')
      }
    }

    const war: FactionWar = {
      id: `war-${Date.now()}`,
      challengerId: declaration.challengerGuildId,
      defenderId: declaration.defenderGuildId,
      sectorId: declaration.sectorId,
      startedAtChapter: declaration.startChapter,
      endsAtChapter: declaration.startChapter + declaration.durationChapters,
      challengerScore: 0,
      defenderScore: 0,
      status: 'active',
    }

    this.activeWars.set(war.id, war)
    challenger.warHistory.push(war)
    defender.warHistory.push(war)

    return war
  }

  /**
   * Record a chapter outcome for an active war.
   * The guild that bet correctly earns war points.
   */
  recordWarChapterResult(
    warId: string,
    winningGuildId: string | null,
    betAmounts: { challenger: number; defender: number },
  ): void {
    const war = this.activeWars.get(warId)
    if (!war || war.status !== 'active') return

    // Points proportional to bet amount
    if (winningGuildId === war.challengerId) {
      war.challengerScore += Math.ceil(betAmounts.challenger / 10)
    } else if (winningGuildId === war.defenderId) {
      war.defenderScore += Math.ceil(betAmounts.defender / 10)
    }
    // null = tie chapter, no points
  }

  /**
   * Resolve a war when it reaches its end chapter.
   */
  resolveWar(
    warId: string,
    registry: GuildRegistry,
    voidMap: VoidMapController,
  ): FactionWarResult {
    const war = this.activeWars.get(warId)
    if (!war) throw new Error(`War ${warId} not found`)
    if (war.status !== 'active') throw new Error('War already resolved')

    let winner: 'challenger' | 'defender' | 'draw'
    let winnerGuildId: string | undefined
    let loserGuildId: string | undefined

    if (war.challengerScore > war.defenderScore) {
      winner = 'challenger'
      winnerGuildId = war.challengerId
      loserGuildId = war.defenderId
      war.status = 'challenger_won'
    } else if (war.defenderScore > war.challengerScore) {
      winner = 'defender'
      winnerGuildId = war.defenderId
      loserGuildId = war.challengerId
      war.status = 'defender_won'
    } else {
      winner = 'draw'
      war.status = 'draw'
    }

    // Update scores
    if (winnerGuildId) {
      const winnerGuild = registry.getGuild(winnerGuildId)
      winnerGuild.score += SCORE_WEIGHTS.WAR_WIN
      winnerGuild.totalScore += SCORE_WEIGHTS.WAR_WIN
    }
    if (loserGuildId) {
      const loserGuild = registry.getGuild(loserGuildId)
      loserGuild.score += SCORE_WEIGHTS.WAR_LOSS
    }

    // Transfer territory to winner
    let territoryTransfer: SectorControl | null = null
    if (winnerGuildId && loserGuildId) {
      voidMap.recordSectorWin(war.sectorId, winnerGuildId)
      territoryTransfer = {
        sectorId: war.sectorId,
        sectorName: VOID_MAP_SECTORS.find(s => s.id === war.sectorId)?.name ?? war.sectorId,
        storyArc: VOID_MAP_SECTORS.find(s => s.id === war.sectorId)?.storyArc ?? '',
        controlledSince: new Date(),
        passiveYieldRate: VOID_MAP_SECTORS.find(s => s.id === war.sectorId)?.yieldRate ?? 0.005,
        earnedUSDC: 0,
        lastClaimedAt: new Date(),
      }
    }

    // Mint trophy NFT
    const trophy: WarTrophyNFT | undefined = winnerGuildId ? {
      tokenId: `war-trophy-${war.id}`,
      winnerId: winnerGuildId,
      sectorId: war.sectorId,
      warId: war.id,
      mintedAt: new Date(),
      imageUri: `https://voidborne.ai/trophies/${war.id}.png`,
      metadata: {
        warId: war.id,
        challengerScore: war.challengerScore,
        defenderScore: war.defenderScore,
        sector: war.sectorId,
        chaptersContested: war.endsAtChapter - war.startedAtChapter,
      },
    } : undefined

    if (trophy) war.trophyNFT = trophy
    war.resolvedAt = new Date()

    const sectorName = VOID_MAP_SECTORS.find(s => s.id === war.sectorId)?.name ?? 'Unknown Sector'
    const narrativeConsequence = winner === 'draw'
      ? `The battle for ${sectorName} ended in a tense stalemate. Both factions withdraw, bloodied but unbroken.`
      : winner === 'challenger'
      ? `The challenger has seized ${sectorName}. The defending faction retreats, their influence in the sector shattered.`
      : `The defender held ${sectorName} against all assault. The challenger's ambitions have been crushed.`

    return {
      war,
      winner,
      scoreDelta: Math.abs(war.challengerScore - war.defenderScore),
      territoryTransfer,
      trophyMinted: !!trophy,
      narrativeConsequence,
    }
  }

  getActiveWars(): FactionWar[] {
    return Array.from(this.activeWars.values()).filter(w => w.status === 'active')
  }
}

// ─── GuildLeaderboard ─────────────────────────────────────────────────────────

export class GuildLeaderboard {
  computeLeaderboard(
    registry: GuildRegistry,
    voidMap: VoidMapController,
  ): GuildScore[] {
    const guilds = registry.getAllGuilds()

    const scores: GuildScore[] = guilds.map(guild => {
      const settled = guild.treasury.bets.filter(b => b.status !== 'pending')
      const wins = settled.filter(b => b.status === 'won').length
      const winRate = settled.length > 0 ? wins / settled.length : 0
      const territory = voidMap.getGuildTerritory(guild.id).length
      const activeMembersLast7d = guild.members.filter(m =>
        m.joinedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length

      return {
        guildId: guild.id,
        guildName: `[${guild.tag}] ${guild.name}`,
        house: guild.house,
        tier: guild.tier,
        monthlyScore: guild.score,
        winRate,
        territory,
        membersActive: activeMembersLast7d,
        rank: 0,
      }
    })

    // Sort by monthly score
    scores.sort((a, b) => b.monthlyScore - a.monthlyScore)
    scores.forEach((s, i) => { s.rank = i + 1 })

    return scores
  }

  /**
   * Get the top guild that earns the Agenda Slot this chapter.
   */
  getAgendaWinner(
    registry: GuildRegistry,
    voidMap: VoidMapController,
  ): Guild | null {
    const board = this.computeLeaderboard(registry, voidMap)
    if (board.length === 0) return null
    const top = board[0]
    if (!top) return null
    return registry.getGuild(top.guildId)
  }
}

// ─── AgendaInjector ──────────────────────────────────────────────────────────

export class AgendaInjector {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic()
  }

  /**
   * Vote on an agenda proposal. Leaders and officers can vote.
   * Requires 2/3 supermajority to pass.
   */
  voteOnAgenda(
    proposal: AgendaProposal,
    guild: Guild,
    voterAddress: string,
    approve: boolean,
  ): AgendaProposal {
    const voter = guild.members.find(m => m.walletAddress === voterAddress)
    if (!voter) throw new Error('Not a guild member')
    if (voter.role === 'member') throw new Error('Only leaders and officers can vote on agenda')

    proposal.votes[voterAddress] = approve
    return proposal
  }

  /**
   * Check if agenda proposal has passed (2/3 supermajority of officers+leader).
   */
  isAgendaApproved(proposal: AgendaProposal, guild: Guild): boolean {
    const eligible = guild.members.filter(m => m.role !== 'member')
    if (eligible.length === 0) return true   // Solo leader auto-approves

    const totalVotes = Object.keys(proposal.votes).length
    const approveVotes = Object.values(proposal.votes).filter(Boolean).length

    return totalVotes >= Math.ceil(eligible.length * 0.5) && // Quorum: 50%
      approveVotes >= Math.ceil(totalVotes * 0.667)           // Supermajority: 66.7%
  }

  /**
   * Generate the narrative consequence of a guild's agenda injection.
   * Called after chapter generation to log how Claude interpreted the agenda.
   */
  async interpretAgendaImpact(
    agendaText: string,
    chapterContent: string,
    guildName: string,
    house: HouseAlignment,
  ): Promise<string> {
    const systemPrompt = `You are a narrative analyst for Voidborne: The Silent Throne, 
a space political saga. Your job is to identify how a faction's agenda influenced the generated chapter.
Be specific about narrative moments that reflect the agenda. Keep response to 2-3 sentences.`

    const userPrompt = `Guild "${guildName}" (House ${house}) injected this agenda: "${agendaText}"

Generated chapter excerpt (first 800 chars):
${chapterContent.slice(0, 800)}

How did the chapter reflect this agenda? What narrative moments embody the guild's influence?`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    return (response.content[0] as { text: string }).text
  }

  /**
   * Build the Claude system prompt enriched with the winning guild's agenda.
   */
  buildEnrichedPrompt(
    basePrompt: string,
    agendaText: string,
    guildName: string,
    house: HouseAlignment,
    territory: VoidMapSector[],
  ): string {
    const territoryNames = territory.map(t => t.name).join(', ')

    return `${basePrompt}

═══════════════════════════════════════════════════
FACTION AGENDA DIRECTIVE — CONFIDENTIAL
Issued by: Guild ${guildName} (House ${house})
Territory Controlled: ${territoryNames || 'None'}
═══════════════════════════════════════════════════

The following narrative agenda has been earned through competitive faction victory
and must be subtly woven into this chapter. Do not announce it directly — integrate
it naturally as part of the story's political landscape:

"${agendaText}"

Ensure House ${house}'s perspective and interests are present in this chapter,
consistent with their canonical traits and the guild's earned influence.
═══════════════════════════════════════════════════`
  }
}

// ─── Main Engine Orchestrator ─────────────────────────────────────────────────

export class NarrativeGuildEngine {
  public registry: GuildRegistry
  public treasury: GuildTreasuryManager
  public voidMap: VoidMapController
  public warEngine: FactionWarEngine
  public leaderboard: GuildLeaderboard
  public agendaInjector: AgendaInjector

  constructor() {
    this.registry = new GuildRegistry()
    this.treasury = new GuildTreasuryManager(this.registry)
    this.voidMap = new VoidMapController()
    this.warEngine = new FactionWarEngine()
    this.leaderboard = new GuildLeaderboard()
    this.agendaInjector = new AgendaInjector()
  }

  /**
   * Process end-of-chapter: resolve bets, update territory, check wars, compute leaderboard.
   */
  processChapterResolution(params: {
    chapterId: string
    winnerChoiceId: string
    totalBettingVolumeUSDC: number
    chapterNumber: number
  }): {
    leaderboard: GuildScore[]
    warResolutions: FactionWarResult[]
    agendaWinner: Guild | null
    territoryYields: Record<string, number>  // guildId → yield USDC
  } {
    const guilds = this.registry.getAllGuilds()

    // 1. Resolve pending bets for all guilds
    for (const guild of guilds) {
      for (const bet of guild.treasury.bets.filter(b =>
        b.chapterId === params.chapterId && b.status === 'pending'
      )) {
        const won = bet.choiceId === params.winnerChoiceId
        const payout = won ? bet.amountUSDC * 2.1 : 0   // Simplified payout
        this.treasury.resolveBet({
          guildId: guild.id,
          betId: bet.id,
          won,
          payoutUSDC: payout,
          winnerChoiceId: params.winnerChoiceId,
        })

        if (won) {
          // Find which sector this chapter belongs to and record win
          const sector = VOID_MAP_SECTORS.find(s =>
            s.storyArc.includes('Act 1') && params.chapterNumber <= 15
          ) ?? VOID_MAP_SECTORS[0]
          if (sector) {
            this.voidMap.recordSectorWin(sector.id, guild.id)
          }
        }
      }
    }

    // 2. Resolve expired wars
    const warResolutions: FactionWarResult[] = []
    for (const war of this.warEngine.getActiveWars()) {
      if (params.chapterNumber >= war.endsAtChapter) {
        try {
          const result = this.warEngine.resolveWar(war.id, this.registry, this.voidMap)
          warResolutions.push(result)
        } catch (e) {
          console.error('War resolution error:', e)
        }
      }
    }

    // 3. Compute territory yields
    const territoryYields: Record<string, number> = {}
    for (const guild of guilds) {
      const yield_ = this.voidMap.calculateTerritoryYield(guild.id, params.totalBettingVolumeUSDC)
      if (yield_ > 0) {
        territoryYields[guild.id] = yield_
        guild.treasury.pendingYield += yield_
        guild.score += SCORE_WEIGHTS.TERRITORY_HELD_PER_CHAPTER * this.voidMap.getGuildTerritory(guild.id).length
      }
    }

    // 4. Compute leaderboard
    const lb = this.leaderboard.computeLeaderboard(this.registry, this.voidMap)

    // 5. Determine agenda winner for next chapter
    const agendaWinner = this.leaderboard.getAgendaWinner(this.registry, this.voidMap)

    return {
      leaderboard: lb,
      warResolutions,
      agendaWinner,
      territoryYields,
    }
  }
}

// ─── Factory + Demo ────────────────────────────────────────────────────────────

export function createGuildEngine(): NarrativeGuildEngine {
  return new NarrativeGuildEngine()
}

export async function runGuildFactionDemo(): Promise<void> {
  console.log('\n🏰 NARRATIVE GUILDS & FACTION WARS — Demo\n')
  console.log('═'.repeat(60))

  const engine = createGuildEngine()

  // --- Create Guilds ---
  console.log('\n1. GUILD FORMATION')
  console.log('─'.repeat(40))

  const ironVeil = engine.registry.createGuild({
    name: 'Iron Veil Brotherhood',
    tag: 'IVB',
    description: 'Valdris loyalists. Honor above all.',
    house: 'valdris',
    founderAddress: '0x1111111111111111111111111111111111111111',
    founderUsername: 'Archon_Valdris',
    registrationTx: '0xabc123',
  })

  const shadowhand = engine.registry.createGuild({
    name: 'The Shadowhand Syndicate',
    tag: 'SHS',
    description: 'Obsidian operatives. Information is power.',
    house: 'obsidian',
    founderAddress: '0x2222222222222222222222222222222222222222',
    founderUsername: 'NullSeer_Prime',
    registrationTx: '0xdef456',
  })

  const strandsKeepers = engine.registry.createGuild({
    name: 'Keepers of the Grand Strand',
    tag: 'KGS',
    description: 'Ancient law. Cosmic order. Eternal vigilance.',
    house: 'strand',
    founderAddress: '0x3333333333333333333333333333333333333333',
    founderUsername: 'Archivum_Eternal',
    registrationTx: '0xghi789',
  })

  console.log(`✅ [${ironVeil.tag}] ${ironVeil.name} — House ${ironVeil.house}`)
  console.log(`✅ [${shadowhand.tag}] ${shadowhand.name} — House ${shadowhand.house}`)
  console.log(`✅ [${strandsKeepers.tag}] ${strandsKeepers.name} — House ${strandsKeepers.house}`)

  // --- Members join ---
  engine.registry.joinGuild({
    guildId: ironVeil.id,
    walletAddress: '0x4444444444444444444444444444444444444444',
    username: 'ThreadKnight_9',
  })
  engine.registry.joinGuild({
    guildId: shadowhand.id,
    walletAddress: '0x5555555555555555555555555555555555555555',
    username: 'Veil_Dancer',
  })

  console.log(`\n  [${ironVeil.tag}] members: ${ironVeil.members.length}`)
  console.log(`  [${shadowhand.tag}] members: ${shadowhand.members.length}`)

  // --- Treasury deposits + bets ---
  console.log('\n2. TREASURY OPERATIONS')
  console.log('─'.repeat(40))

  engine.treasury.deposit({ guildId: ironVeil.id, memberAddress: '0x1111111111111111111111111111111111111111', amountUSDC: 500 })
  engine.treasury.deposit({ guildId: ironVeil.id, memberAddress: '0x4444444444444444444444444444444444444444', amountUSDC: 300 })
  engine.treasury.deposit({ guildId: shadowhand.id, memberAddress: '0x2222222222222222222222222222222222222222', amountUSDC: 750 })

  console.log(`  [${ironVeil.tag}] Treasury: $${ironVeil.treasury.balanceUSDC} USDC`)
  console.log(`  [${shadowhand.tag}] Treasury: $${shadowhand.treasury.balanceUSDC} USDC`)

  // Place bets
  const ivbBet = engine.treasury.proposeBet({
    guildId: ironVeil.id,
    chapterId: 'chapter-07',
    choiceId: 'choice-A',
    amountUSDC: 400,
    proposedBy: '0x1111111111111111111111111111111111111111',
    voteWeights: {
      '0x1111111111111111111111111111111111111111': 1.0,
      '0x4444444444444444444444444444444444444444': 0.8,
    },
  })

  const shsBet = engine.treasury.proposeBet({
    guildId: shadowhand.id,
    chapterId: 'chapter-07',
    choiceId: 'choice-B',
    amountUSDC: 600,
    proposedBy: '0x2222222222222222222222222222222222222222',
    voteWeights: { '0x2222222222222222222222222222222222222222': 1.0 },
  })

  console.log(`  [${ironVeil.tag}] Bet $400 on Choice A`)
  console.log(`  [${shadowhand.tag}] Bet $600 on Choice B`)

  // --- War declaration ---
  console.log('\n3. FACTION WAR DECLARATION')
  console.log('─'.repeat(40))

  const war = engine.warEngine.declareWar(
    {
      challengerGuildId: ironVeil.id,
      defenderGuildId: shadowhand.id,
      sectorId: 'sector-003',   // The Void Gate Approach
      wagerUSDC: 200,
      reason: 'Control of the Void Gate Approach. The Void belongs to House Valdris!',
      startChapter: 7,
      durationChapters: 3,
    },
    engine.registry,
  )

  console.log(`  ⚔️ WAR DECLARED: [${ironVeil.tag}] vs [${shadowhand.tag}]`)
  console.log(`  📍 Contested Sector: The Void Gate Approach`)
  console.log(`  ⏱️ Duration: Chapters ${war.startedAtChapter} → ${war.endsAtChapter}`)

  // --- Chapter resolution ---
  console.log('\n4. CHAPTER 7 RESOLUTION')
  console.log('─'.repeat(40))

  // Resolve bets manually (Choice A wins — IVB wins!)
  engine.treasury.resolveBet({
    guildId: ironVeil.id,
    betId: ivbBet.id,
    won: true,
    payoutUSDC: 840,  // 400 * 2.1
    winnerChoiceId: 'choice-A',
  })
  engine.treasury.resolveBet({
    guildId: shadowhand.id,
    betId: shsBet.id,
    won: false,
    payoutUSDC: 0,
    winnerChoiceId: 'choice-A',
  })

  // Record war chapter result
  engine.warEngine.recordWarChapterResult(war.id, ironVeil.id, { challenger: 400, defender: 600 })

  // Territory win for IVB in sector-001
  engine.voidMap.recordSectorWin('sector-001', ironVeil.id)
  engine.voidMap.recordSectorWin('sector-001', ironVeil.id)

  console.log(`  ✅ Choice A wins! [${ironVeil.tag}] pocket $${ironVeil.treasury.pendingYield} USDC`)
  console.log(`  ❌ [${shadowhand.tag}] loses $600 bet`)
  console.log(`  🗺️ [${ironVeil.tag}] claims sector-001 (The Silent Throne Antechamber)`)

  // --- Leaderboard ---
  console.log('\n5. FACTION LEADERBOARD')
  console.log('─'.repeat(40))

  const lb = engine.leaderboard.computeLeaderboard(engine.registry, engine.voidMap)
  lb.forEach(entry => {
    console.log(`  #${entry.rank} [${entry.guildName}] | Score: ${entry.monthlyScore} | WR: ${(entry.winRate * 100).toFixed(0)}% | Territory: ${entry.territory} sectors | Tier: ${entry.tier.toUpperCase()}`)
  })

  // --- Agenda Winner ---
  console.log('\n6. AGENDA SLOT AWARD')
  console.log('─'.repeat(40))

  const agendaWinner = engine.leaderboard.getAgendaWinner(engine.registry, engine.voidMap)
  if (agendaWinner) {
    const agendaText = `House Valdris's sacrifice and military code must be honored in this chapter — a Valdris soldier must face an impossible moral choice that defines the House's character.`
    const enrichedPrompt = engine.agendaInjector.buildEnrichedPrompt(
      '[BASE CLAUDE SYSTEM PROMPT]',
      agendaText,
      agendaWinner.name,
      agendaWinner.house,
      engine.voidMap.getGuildTerritory(agendaWinner.id),
    )
    console.log(`  🏆 Agenda Winner: [${agendaWinner.tag}] ${agendaWinner.name}`)
    console.log(`  📜 Agenda Injected: "${agendaText.slice(0, 80)}..."`)
    console.log(`  📝 Prompt enriched with guild agenda for Chapter 8`)
  }

  // --- Void Map ---
  console.log('\n7. VOID MAP STATE')
  console.log('─'.repeat(40))

  const map = engine.voidMap.getVoidMap()
  map.forEach(sector => {
    const status = sector.controllingGuild
      ? `CONTROLLED by guild ${sector.controllingGuild.slice(-6)}`
      : sector.contestedBy
      ? `CONTESTED (${sector.contestedBy.length} factions)`
      : 'UNCLAIMED'
    console.log(`  📍 ${sector.name}: ${status}`)
  })

  // --- Territory yield ---
  console.log('\n8. TERRITORY YIELD CALCULATION')
  console.log('─'.repeat(40))

  const totalVolume = 50_000  // $50K chapter betting volume
  const ivbYield = engine.voidMap.calculateTerritoryYield(ironVeil.id, totalVolume)
  console.log(`  [${ironVeil.tag}] Passive territory yield: $${ivbYield.toFixed(2)} USDC`)
  console.log(`  (On $${totalVolume.toLocaleString()} chapter betting volume)`)

  console.log('\n' + '═'.repeat(60))
  console.log('✅ DEMO COMPLETE — Narrative Guilds & Faction Wars')
  console.log('═'.repeat(60))

  console.log(`
📊 SUMMARY:
  • 3 Guilds created across 3 Houses
  • 1 War declared (Chapters 7-10)
  • $1,050 USDC in collective treasury bets
  • 1 territory sector claimed
  • 1 Agenda Slot earned (narrative influence for Chapter 8)
  • Void Map: 6 sectors, 1 controlled

💡 INNOVATION IMPACT:
  • Players now have tribal identity → social stakes
  • Guild treasury creates collective decision-making
  • Territory = passive income for consistent winners
  • Agenda injection = actual story influence
  • Wars = inter-guild drama + Twitter content`)
}
