/**
 * @module prophecy-nft/client
 * @description TypeScript SDK for the Voidborne Prophecy NFT system.
 *
 * Innovation Cycle #49 — "The Living Cosmos"
 *
 * Usage:
 * ```typescript
 * import { ProphecyNFTClient } from '@voidborne/prophecy-nft'
 *
 * const client = new ProphecyNFTClient({ contractAddress, forgeAddress, rpcUrl })
 *
 * // Mint a prophecy NFT (user-facing)
 * const { tokenId, mintOrder } = await client.mint({ prophecyId: 1n, minter: userAddress })
 *
 * // Oracle: seed prophecies pre-chapter
 * await client.oracle.seedProphecies(chapterId, generatedProphecies)
 *
 * // Oracle: fulfill post-resolution
 * await client.oracle.fulfillProphecies(chapterId, chapterOutcome)
 * ```
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  type Account,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import {
  type Prophecy,
  type ProphecyToken,
  type MintResult,
  type OraclePackResult,
  type BatchFulfillmentResult,
  type ChapterProphecyGallery,
  type ProphecyLeaderboard,
  FulfillmentStatus,
  ProphecyRarity,
  OracleRank,
} from './types.js'
import { ProphecyGenerator, buildPendingMetadata, buildFulfilledMetadata } from './generator.js'

// ─── ABI (minimal) ────────────────────────────────────────────────────────────

const PROPHECY_NFT_ABI = [
  // View
  {
    name: 'prophecies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'prophecyId', type: 'uint256' }],
    outputs: [
      { name: 'prophecyId',     type: 'uint256' },
      { name: 'chapterId',      type: 'uint256' },
      { name: 'contentHash',    type: 'bytes32' },
      { name: 'pendingURI',     type: 'string' },
      { name: 'fulfilledURI',   type: 'string' },
      { name: 'echoedURI',      type: 'string' },
      { name: 'unfulfilledURI', type: 'string' },
      { name: 'mintedCount',    type: 'uint256' },
      { name: 'mintedAt',       type: 'uint256' },
      { name: 'revealed',       type: 'bool' },
      { name: 'status',         type: 'uint8' },
    ],
  },
  {
    name: 'tokenData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'prophecyId', type: 'uint256' },
      { name: 'mintOrder',  type: 'uint256' },
      { name: 'mintedAt',   type: 'uint256' },
      { name: 'minter',     type: 'address' },
    ],
  },
  {
    name: 'getPropheciesForChapter',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'chapterId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getMintStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'prophecyId', type: 'uint256' }],
    outputs: [
      { name: 'minted', type: 'uint256' },
      { name: 'remaining', type: 'uint256' },
    ],
  },
  {
    name: 'hasMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'prophecyId', type: 'uint256' },
      { name: 'addr', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  // Write — User
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'prophecyId', type: 'uint256' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'mintOraclePack',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'prophecyIds', type: 'uint256[]' }],
    outputs: [{ name: 'tokenIds', type: 'uint256[]' }],
  },
  // Write — Oracle
  {
    name: 'seedProphecy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'chapterId',   type: 'uint256' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'pendingURI',  type: 'string' },
    ],
    outputs: [{ name: 'prophecyId', type: 'uint256' }],
  },
  {
    name: 'revealProphecy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'prophecyId', type: 'uint256' },
      { name: 'text',       type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'fulfillProphecies',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'prophecyIds',  type: 'uint256[]' },
      { name: 'statuses',     type: 'uint8[]' },
      { name: 'metadataURIs', type: 'string[]' },
    ],
    outputs: [],
  },
] as const

// ─── Status Mapping ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, FulfillmentStatus> = {
  0: FulfillmentStatus.PENDING,
  1: FulfillmentStatus.UNFULFILLED,
  2: FulfillmentStatus.ECHOED,
  3: FulfillmentStatus.FULFILLED,
}

function statusToUint8(status: FulfillmentStatus): number {
  const map: Record<FulfillmentStatus, number> = {
    [FulfillmentStatus.PENDING]:     0,
    [FulfillmentStatus.UNFULFILLED]: 1,
    [FulfillmentStatus.ECHOED]:      2,
    [FulfillmentStatus.FULFILLED]:   3,
  }
  return map[status]
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface ProphecyNFTConfig {
  contractAddress: Address
  forgeAddress:    Address
  rpcUrl:          string
  testnet?:        boolean
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class ProphecyNFTClient {
  private readonly config: ProphecyNFTConfig
  private readonly publicClient: PublicClient
  readonly oracle: OracleClient
  readonly generator: ProphecyGenerator

  constructor(config: ProphecyNFTConfig, anthropicApiKey?: string) {
    this.config = config

    this.publicClient = createPublicClient({
      chain:     config.testnet ? baseSepolia : base,
      transport: http(config.rpcUrl),
    }) as PublicClient

    this.generator = new ProphecyGenerator(anthropicApiKey)
    this.oracle    = new OracleClient(config, this.publicClient, this.generator)
  }

  // ─── User-Facing: Mint ─────────────────────────────────────────────────

  /**
   * Mint a single Prophecy NFT. Requires $FORGE approval first.
   *
   * @param prophecyId - Which prophecy to mint
   * @param walletClient - User's connected wallet client
   * @returns MintResult with tokenId, mintOrder, txHash
   */
  async mint(
    prophecyId: bigint,
    walletClient: WalletClient & { account: Account },
  ): Promise<MintResult> {
    const prophecy = await this.getProphecy(prophecyId)

    if (!prophecy) throw new Error(`ProphecyNFTClient: prophecy ${prophecyId} not found`)
    if (prophecy.status !== FulfillmentStatus.PENDING) {
      throw new Error(`ProphecyNFTClient: prophecy ${prophecyId} already resolved`)
    }
    if (prophecy.mintedCount >= 100n) {
      throw new Error(`ProphecyNFTClient: prophecy ${prophecyId} sold out`)
    }

    const txHash = await walletClient.writeContract({
      address:      this.config.contractAddress,
      abi:          PROPHECY_NFT_ABI,
      functionName: 'mint',
      args:         [prophecyId],
      account:      walletClient.account,
      chain:        this.config.testnet ? baseSepolia : base,
    }) as Hash

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash })

    // Parse ProphecyMinted event from logs
    // (simplified — production would decode full logs)
    const mintOrder = prophecy.mintedCount + 1n

    return {
      tokenId:    0n, // populated from event in production
      mintOrder,
      txHash,
      forgePaid:  5n * 10n ** 18n,
      prophecy:   { ...prophecy, mintedCount: mintOrder },
    }
  }

  /**
   * Mint an Oracle Pack (up to 20 prophecies, 10% discount).
   */
  async mintOraclePack(
    prophecyIds: bigint[],
    walletClient: WalletClient & { account: Account },
  ): Promise<OraclePackResult> {
    if (prophecyIds.length === 0 || prophecyIds.length > 20) {
      throw new Error('ProphecyNFTClient: Oracle Pack requires 1-20 prophecies')
    }

    const txHash = await walletClient.writeContract({
      address:      this.config.contractAddress,
      abi:          PROPHECY_NFT_ABI,
      functionName: 'mintOraclePack',
      args:         [prophecyIds],
      account:      walletClient.account,
      chain:        this.config.testnet ? baseSepolia : base,
    }) as Hash

    await this.publicClient.waitForTransactionReceipt({ hash: txHash })

    const discountedPrice = (5n * BigInt(prophecyIds.length) * 90n / 100n) * 10n ** 18n

    return {
      tokenIds:  [], // parsed from events in production
      count:     prophecyIds.length,
      txHash,
      forgePaid: discountedPrice,
    }
  }

  // ─── View: Prophecy Data ───────────────────────────────────────────────

  /**
   * Fetch a prophecy by ID from on-chain.
   */
  async getProphecy(prophecyId: bigint): Promise<Prophecy | null> {
    try {
      const data = await this.publicClient.readContract({
        address:      this.config.contractAddress,
        abi:          PROPHECY_NFT_ABI,
        functionName: 'prophecies',
        args:         [prophecyId],
      }) as [bigint, bigint, `0x${string}`, string, string, string, string, bigint, bigint, boolean, number]

      if (data[0] === 0n) return null

      return {
        prophecyId:     data[0],
        chapterId:      data[1],
        contentHash:    data[2],
        pendingURI:     data[3],
        fulfilledURI:   data[4] || undefined,
        echoedURI:      data[5] || undefined,
        unfulfilledURI: data[6] || undefined,
        mintedCount:    data[7],
        mintedAt:       new Date(Number(data[8]) * 1000),
        revealed:       data[9],
        status:         STATUS_MAP[data[10]] ?? FulfillmentStatus.PENDING,
      }
    } catch {
      return null
    }
  }

  /**
   * Fetch all prophecies for a given chapter.
   */
  async getChapterProphecies(chapterId: bigint): Promise<ChapterProphecyGallery> {
    const ids = await this.publicClient.readContract({
      address:      this.config.contractAddress,
      abi:          PROPHECY_NFT_ABI,
      functionName: 'getPropheciesForChapter',
      args:         [chapterId],
    }) as bigint[]

    const prophecies = await Promise.all(ids.map((id) => this.getProphecy(id)))

    const items = prophecies.filter(Boolean).map((p) => ({
      prophecy: p!,
      minted:   Number(p!.mintedCount),
      remaining: 100 - Number(p!.mintedCount),
      teaser:   '▓▓▓ sealed until minting closes ▓▓▓',
    }))

    return {
      chapterId,
      prophecies: items,
      totalMinted: items.reduce((sum, i) => sum + i.minted, 0),
    }
  }

  /**
   * Get all tokens owned by an address.
   */
  async getTokensByOwner(_owner: Address): Promise<ProphecyToken[]> {
    // In production: query via Alchemy NFT API or indexed event logs
    // POC stub — returns empty
    return []
  }

  /**
   * Compute rarity for a token given its prophecy status and mint order.
   */
  computeRarity(status: FulfillmentStatus, mintOrder: bigint): ProphecyRarity {
    if (status === FulfillmentStatus.FULFILLED) {
      return mintOrder <= 5n ? ProphecyRarity.MYTHIC : ProphecyRarity.LEGENDARY
    }
    if (status === FulfillmentStatus.ECHOED) {
      return mintOrder <= 10n ? ProphecyRarity.RARE : ProphecyRarity.UNCOMMON
    }
    return ProphecyRarity.COMMON
  }

  /**
   * Compute oracle rank for an address based on fulfilled prophecy count.
   */
  computeOracleRank(fulfilled: number): OracleRank {
    if (fulfilled >= 50) return OracleRank.VOID_EYE
    if (fulfilled >= 25) return OracleRank.PROPHET
    if (fulfilled >= 10) return OracleRank.ORACLE
    if (fulfilled >= 3)  return OracleRank.SEER
    return OracleRank.NOVICE
  }
}

// ─── Oracle Client (Admin-only) ───────────────────────────────────────────────

export class OracleClient {
  private readonly config: ProphecyNFTConfig
  private readonly publicClient: PublicClient
  private readonly generator: ProphecyGenerator

  constructor(
    config: ProphecyNFTConfig,
    publicClient: PublicClient,
    generator: ProphecyGenerator,
  ) {
    this.config       = config
    this.publicClient = publicClient
    this.generator    = generator
  }

  /**
   * Seed on-chain prophecies for a chapter (called 24h before betting opens).
   *
   * Flow:
   *   1. AI generates prophecies with sealed content hashes
   *   2. Oracle calls seedProphecy() for each → commits hash on-chain
   *   3. Minting window opens (texts remain sealed)
   *
   * @param chapterId - Target chapter
   * @param prophecies - Pre-generated sealed prophecies (from ProphecyGenerator)
   * @param pendingURIs - IPFS URIs for each pending NFT's metadata
   * @param walletClient - Oracle wallet client
   */
  async seedProphecies(
    chapterId: bigint,
    prophecies: Array<{ contentHash: `0x${string}`; pendingURI: string }>,
    walletClient: WalletClient & { account: Account },
  ): Promise<Hash[]> {
    const hashes: Hash[] = []

    for (const p of prophecies) {
      const txHash = await walletClient.writeContract({
        address:      this.config.contractAddress,
        abi:          PROPHECY_NFT_ABI,
        functionName: 'seedProphecy',
        args:         [chapterId, p.contentHash, p.pendingURI],
        account:      walletClient.account,
        chain:        baseSepolia,
      }) as Hash

      await this.publicClient.waitForTransactionReceipt({ hash: txHash })
      hashes.push(txHash)
    }

    return hashes
  }

  /**
   * Reveal prophecy texts after minting window closes.
   * Verifies hash preimage on-chain.
   */
  async revealProphecies(
    reveals: Array<{ prophecyId: bigint; text: string }>,
    walletClient: WalletClient & { account: Account },
  ): Promise<Hash[]> {
    const hashes: Hash[] = []

    for (const r of reveals) {
      const txHash = await walletClient.writeContract({
        address:      this.config.contractAddress,
        abi:          PROPHECY_NFT_ABI,
        functionName: 'revealProphecy',
        args:         [r.prophecyId, r.text],
        account:      walletClient.account,
        chain:        baseSepolia,
      }) as Hash

      await this.publicClient.waitForTransactionReceipt({ hash: txHash })
      hashes.push(txHash)
    }

    return hashes
  }

  /**
   * Fulfill prophecies after chapter resolution.
   *
   * Flow:
   *   1. Chapter resolves → AI picks a choice
   *   2. Oracle evaluates each prophecy against the outcome
   *   3. Determines FULFILLED / ECHOED / UNFULFILLED for each
   *   4. Uploads final metadata to IPFS per status
   *   5. Calls fulfillProphecies() → NFT art transforms on-chain
   *
   * @param chapterId - Which chapter just resolved
   * @param chapterOutcome - Summary of what happened
   * @param walletClient - Oracle wallet client
   */
  async fulfillChapterProphecies(
    chapterId: bigint,
    chapterOutcome: string,
    prophecyTexts: Array<{ prophecyId: bigint; text: string }>,
    metadataURIBuilder: (
      prophecyId: bigint,
      status: FulfillmentStatus,
    ) => Promise<string>,
    walletClient: WalletClient & { account: Account },
  ): Promise<BatchFulfillmentResult> {
    // 1. Evaluate fulfillment via AI
    const evaluations = await this.generator.evaluateFulfillment(
      prophecyTexts.map((p) => p.text),
      chapterOutcome,
      prophecyTexts.map((p) => p.prophecyId),
    )

    // 2. Build final metadata URIs per prophecy
    const metadataURIs: string[] = []
    for (const ev of evaluations) {
      const uri = await metadataURIBuilder(ev.prophecyId, ev.status)
      metadataURIs.push(uri)
      ev.metadataURI = uri
    }

    // 3. Batch fulfill on-chain
    const txHash = await walletClient.writeContract({
      address:      this.config.contractAddress,
      abi:          PROPHECY_NFT_ABI,
      functionName: 'fulfillProphecies',
      args: [
        evaluations.map((e) => e.prophecyId),
        evaluations.map((e) => statusToUint8(e.status)),
        metadataURIs,
      ],
      account: walletClient.account,
      chain:   baseSepolia,
    }) as Hash

    await this.publicClient.waitForTransactionReceipt({ hash: txHash })

    const fulfilled   = evaluations.filter((e) => e.status === FulfillmentStatus.FULFILLED).length
    const echoed      = evaluations.filter((e) => e.status === FulfillmentStatus.ECHOED).length
    const unfulfilled = evaluations.filter((e) => e.status === FulfillmentStatus.UNFULFILLED).length

    return {
      total: evaluations.length,
      fulfilled,
      echoed,
      unfulfilled,
      evaluations,
      txHash,
    }
  }
}

export { ProphecyGenerator }
export * from './types.js'
