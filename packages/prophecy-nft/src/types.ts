/**
 * @module prophecy-nft/types
 * @description Type definitions for the Voidborne Prophecy NFT system.
 *
 * Innovation Cycle #49 — "The Living Cosmos"
 *
 * Prophecy NFTs are collectible artifacts minted before chapter resolution.
 * Their on-chain metadata transforms based on how accurately they foretell
 * the AI's narrative decisions.
 */

// ─── Core Enums ───────────────────────────────────────────────────────────────

export enum FulfillmentStatus {
  /** Chapter not yet resolved — NFT shows dark, cryptic art */
  PENDING       = 'PENDING',
  /** Prophecy did not come true — still collectible, "Void relic" */
  UNFULFILLED   = 'UNFULFILLED',
  /** Thematic match — silver artifact, 3× base value */
  ECHOED        = 'ECHOED',
  /** Direct story match — legendary golden artifact, 10× base value */
  FULFILLED     = 'FULFILLED',
}

export enum ProphecyRarity {
  COMMON    = 'COMMON',    // Unfulfilled
  UNCOMMON  = 'UNCOMMON',  // Echoed
  RARE      = 'RARE',      // Echoed (early mint ≤10)
  LEGENDARY = 'LEGENDARY', // Fulfilled
  MYTHIC    = 'MYTHIC',    // Fulfilled + early mint (#1-5 of 100)
}

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface Prophecy {
  /** On-chain prophecy ID */
  prophecyId: bigint
  /** Which chapter this prophecy belongs to */
  chapterId: bigint
  /** Sealed content hash (keccak256 of text) */
  contentHash: `0x${string}`
  /** IPFS URI for pending-state NFT art */
  pendingURI: string
  /** IPFS URI for fulfilled-state NFT art (set after resolution) */
  fulfilledURI?: string
  /** IPFS URI for echoed-state NFT art */
  echoedURI?: string
  /** IPFS URI for unfulfilled-state NFT art */
  unfulfilledURI?: string
  /** Number of NFTs minted for this prophecy (max 100) */
  mintedCount: bigint
  /** Timestamp when prophecy was seeded on-chain */
  mintedAt: Date
  /** Whether the plaintext has been revealed post-minting */
  revealed: boolean
  /** Current fulfillment status */
  status: FulfillmentStatus
  /** Revealed text (populated after reveal oracle call) */
  text?: string
}

export interface ProphecyToken {
  /** ERC-721 token ID */
  tokenId: bigint
  /** Which prophecy this token represents */
  prophecyId: bigint
  /** Mint order 1–100 (earlier = more prestigious) */
  mintOrder: bigint
  /** Timestamp of mint */
  mintedAt: Date
  /** Original minter wallet address */
  minter: `0x${string}`
  /** Current owner (may differ from minter after trades) */
  owner: `0x${string}`
  /** Computed rarity based on fulfillment + mint order */
  rarity: ProphecyRarity
  /** Current metadata URI (dynamic — changes after resolution) */
  metadataURI: string
}

// ─── AI Generation ────────────────────────────────────────────────────────────

export interface ProphecyGenerationRequest {
  /** Chapter content/synopsis provided to AI for context */
  chapterContext: string
  /** Upcoming choices the AI will pick between */
  upcomingChoices: string[]
  /** Active characters and their current arcs */
  characterStates: CharacterState[]
  /** How many prophecies to generate (10-20) */
  count: number
  /** Tone: dark, mystical, political, cosmic */
  tone?: ProphecyTone
}

export interface ProphecyTone {
  darkness: number   // 0-100
  mysticism: number  // 0-100
  political: number  // 0-100
  cosmic: number     // 0-100
}

export interface GeneratedProphecy {
  /** Plaintext prophecy (to be sealed before minting) */
  text: string
  /** keccak256 hash for on-chain sealing */
  contentHash: `0x${string}`
  /** Target story event this prophecy points to */
  targetEvent: string
  /** AI confidence this prophecy will be relevant (0-1) */
  relevanceScore: number
  /** Suggested art style for IPFS metadata */
  artStyle: ProphecyArtStyle
}

export interface ProphecyArtStyle {
  /** Primary visual theme */
  theme: 'void' | 'light' | 'shadow' | 'fire' | 'ice' | 'cosmic'
  /** Color palette */
  palette: string[]
  /** Background image description for DALL-E */
  backgroundPrompt: string
  /** Foreground text styling */
  textStyle: 'rune' | 'carved' | 'glowing' | 'faded'
}

export interface CharacterState {
  name: string
  currentArc: string
  powerLevel: number  // 0-100
  alignment: 'protagonist' | 'antagonist' | 'neutral'
  alive: boolean
}

// ─── Oracle Evaluation ────────────────────────────────────────────────────────

export interface FulfillmentEvaluation {
  /** Prophecy being evaluated */
  prophecyId: bigint
  /** Resolved chapter event summary */
  chapterOutcome: string
  /** AI evaluation result */
  status: FulfillmentStatus
  /** 0-100 score explaining the match degree */
  matchScore: number
  /** Human-readable explanation of fulfillment decision */
  explanation: string
  /** IPFS URI with final metadata for the determined status */
  metadataURI: string
}

export interface BatchFulfillmentResult {
  /** Total prophecies evaluated */
  total: number
  /** How many were FULFILLED (legendary) */
  fulfilled: number
  /** How many were ECHOED (silver) */
  echoed: number
  /** How many were UNFULFILLED */
  unfulfilled: number
  /** Per-prophecy evaluation results */
  evaluations: FulfillmentEvaluation[]
  /** On-chain transaction hash */
  txHash: `0x${string}`
}

// ─── Mint ─────────────────────────────────────────────────────────────────────

export interface MintRequest {
  /** Prophecy to mint */
  prophecyId: bigint
  /** Minter address */
  minter: `0x${string}`
}

export interface MintResult {
  /** Minted token ID */
  tokenId: bigint
  /** Mint order (1-100) */
  mintOrder: bigint
  /** Transaction hash */
  txHash: `0x${string}`
  /** $FORGE spent */
  forgePaid: bigint
  /** Prophecy details */
  prophecy: Prophecy
}

export interface OraclePackResult {
  /** All minted token IDs */
  tokenIds: bigint[]
  /** Total prophecies minted */
  count: number
  /** Transaction hash */
  txHash: `0x${string}`
  /** $FORGE spent (with 10% discount) */
  forgePaid: bigint
}

// ─── Leaderboard & Analytics ──────────────────────────────────────────────────

export interface ProphecyLeaderboard {
  /** Top collectors by fulfilled prophecy count */
  topOracles: OracleEntry[]
  /** Most accurate prophet (highest FULFILLED %) */
  mostAccurate: OracleEntry[]
  /** Most prophetic (highest total mints) */
  mostProlific: OracleEntry[]
  /** Last computed timestamp */
  computedAt: Date
}

export interface OracleEntry {
  address: `0x${string}`
  displayName?: string
  totalMinted: number
  fulfilled: number
  echoed: number
  unfulfilled: number
  /** fulfillmentRate = fulfilled / totalMinted */
  fulfillmentRate: number
  /** Estimated total value (in $FORGE) of their portfolio */
  estimatedValue: bigint
  /** Rank title */
  rank: OracleRank
}

export enum OracleRank {
  NOVICE   = 'NOVICE',    // 0-2 fulfilled
  SEER     = 'SEER',      // 3-9 fulfilled
  ORACLE   = 'ORACLE',    // 10-24 fulfilled
  PROPHET  = 'PROPHET',   // 25-49 fulfilled
  VOID_EYE = 'VOID_EYE',  // 50+ fulfilled
}

// ─── Chapter Gallery ──────────────────────────────────────────────────────────

export interface ChapterProphecyGallery {
  chapterId: bigint
  prophecies: ProphecyGalleryItem[]
  totalMinted: number
  /** Chapter resolution summary (filled after resolution) */
  resolution?: ChapterResolution
}

export interface ProphecyGalleryItem {
  prophecy: Prophecy
  minted: number
  remaining: number
  /** Preview (teaser, not full text until reveal) */
  teaser: string
}

export interface ChapterResolution {
  /** Which AI choice was selected */
  choiceSelected: number
  /** Summary of chapter events */
  eventSummary: string
  /** Total prophecies: fulfilled/echoed/unfulfilled */
  fulfillmentBreakdown: {
    fulfilled: number
    echoed: number
    unfulfilled: number
  }
}
