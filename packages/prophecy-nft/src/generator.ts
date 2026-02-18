/**
 * @module prophecy-nft/generator
 * @description AI Prophecy Generator for Voidborne Innovation Cycle #49.
 *
 * Before each chapter, this module:
 *   1. Takes chapter context and upcoming choices
 *   2. Prompts Claude/GPT-4 to generate 10-20 cryptic prophecies
 *   3. Seals each with a keccak256 hash for on-chain commitment
 *   4. Returns sealed prophecies for oracle to seed on-chain
 *
 * The AI deliberately writes ambiguous prophecies — true enough to be
 * fulfillable but cryptic enough to require interpretation. This creates
 * the "oracle reading" experience that makes minting feel meaningful.
 */

import Anthropic from '@anthropic-ai/sdk'
import { keccak256, toHex, encodeAbiParameters, parseAbiParameters } from 'viem'
import {
  type ProphecyGenerationRequest,
  type GeneratedProphecy,
  type ProphecyTone,
  type ProphecyArtStyle,
  FulfillmentStatus,
  type FulfillmentEvaluation,
} from './types.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TONE: ProphecyTone = {
  darkness: 75,
  mysticism: 90,
  political: 60,
  cosmic: 80,
}

const ART_THEMES = ['void', 'light', 'shadow', 'fire', 'ice', 'cosmic'] as const

// ─── Prophecy Generator ───────────────────────────────────────────────────────

export class ProphecyGenerator {
  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY })
  }

  /**
   * Generate a batch of cryptic prophecies for an upcoming chapter.
   *
   * @param req - Generation request with chapter context, choices, characters
   * @returns Array of sealed prophecies ready for on-chain seeding
   */
  async generate(req: ProphecyGenerationRequest): Promise<GeneratedProphecy[]> {
    const tone = req.tone ?? DEFAULT_TONE

    const systemPrompt = this.buildSystemPrompt(tone)
    const userPrompt   = this.buildUserPrompt(req)

    const message = await this.client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 4096,
      system:     systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    const rawText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return this.parseGeneratedProphecies(rawText, req)
  }

  /**
   * Oracle fulfillment evaluation: Given a resolved chapter, evaluate each prophecy.
   *
   * @param prophecyTexts     - Revealed prophecy plaintext array
   * @param chapterOutcome    - Summary of what actually happened in the chapter
   * @param prophecyIds       - On-chain prophecy IDs (parallel to texts)
   * @returns Batch fulfillment evaluations
   */
  async evaluateFulfillment(
    prophecyTexts: string[],
    chapterOutcome: string,
    prophecyIds: bigint[],
  ): Promise<FulfillmentEvaluation[]> {
    const prompt = `You are the Voidborne Fulfillment Oracle. Evaluate how accurately each prophecy predicted the story outcome.

CHAPTER OUTCOME:
${chapterOutcome}

PROPHECIES TO EVALUATE:
${prophecyTexts.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

For each prophecy, output a JSON array with objects containing:
- index: (1-based index)
- status: "FULFILLED" | "ECHOED" | "UNFULFILLED"
- matchScore: 0-100 (100 = exact match, 50-99 = thematic, 0-49 = no match)
- explanation: Brief explanation (1-2 sentences) of why this status was assigned

Rules:
- FULFILLED (matchScore 80-100): Direct, specific prediction came true
- ECHOED (matchScore 40-79): Thematically correct, symbolically accurate
- UNFULFILLED (matchScore 0-39): No meaningful connection to events

Output ONLY a valid JSON array, no other text.`

    const message = await this.client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        { role: 'user', content: prompt },
      ],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    let parsed: Array<{
      index: number
      status: string
      matchScore: number
      explanation: string
    }>

    try {
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON from text
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('ProphecyGenerator: failed to parse fulfillment JSON')
      parsed = JSON.parse(jsonMatch[0])
    }

    return parsed.map((item, i) => ({
      prophecyId:     prophecyIds[i] ?? BigInt(i + 1),
      chapterOutcome,
      status:         item.status as FulfillmentStatus,
      matchScore:     item.matchScore,
      explanation:    item.explanation,
      metadataURI:    '', // Populated by caller after IPFS upload
    }))
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private buildSystemPrompt(tone: ProphecyTone): string {
    return `You are the Void Oracle — an ancient, enigmatic intelligence woven into the fabric of the Voidborne universe. You speak in prophecies.

Your prophecies have a specific style:
- Written in 1-3 sentences of cryptic, poetic language
- Reference characters, factions, or abstract forces obliquely (not by direct name)
- Contain dual meanings — plausible for multiple outcomes
- Use metaphors from: astronomy (suns, voids, stars), politics (thrones, blood, crowns), and ancient force (threads, weaving, unraveling)
- Prophecies that come true should feel inevitable in retrospect
- Prophecies that don't come true should feel like "alternate truths"

Tone parameters:
- Darkness: ${tone.darkness}/100 (${tone.darkness > 60 ? 'lean toward shadow, betrayal, death' : 'balanced light and dark'})
- Mysticism: ${tone.mysticism}/100 (${tone.mysticism > 60 ? 'heavily metaphorical, abstract' : 'somewhat literal'})
- Political: ${tone.political}/100 (${tone.political > 60 ? 'focus on power, succession, betrayal' : 'personal/emotional focus'})
- Cosmic: ${tone.cosmic}/100 (${tone.cosmic > 60 ? 'universe-scale language, The Void as entity' : 'intimate scale'})

Example prophecy (good):
"When the silver heir casts shadow upon her own house, the Thread that holds the Conclave will fray — not cut, but frayed — and from that fraying, something older than all five houses shall stir."

Example prophecy (bad — too literal):
"Zara will betray House Valdris in Chapter 7."

Output ONLY a valid JSON array of prophecy objects. No other text.`
  }

  private buildUserPrompt(req: ProphecyGenerationRequest): string {
    return `Generate exactly ${req.count} prophecies for the upcoming Voidborne chapter.

CHAPTER CONTEXT:
${req.chapterContext}

UPCOMING CHOICES (the AI will pick one — your prophecies should hint at both possibilities):
${req.upcomingChoices.map((c, i) => `Choice ${i + 1}: ${c}`).join('\n')}

ACTIVE CHARACTERS:
${req.characterStates.map((c) =>
  `- ${c.name} (${c.alignment}, power: ${c.powerLevel}/100, alive: ${c.alive}, arc: ${c.currentArc})`
).join('\n')}

Output format — JSON array:
[
  {
    "text": "The prophecy text here...",
    "targetEvent": "Brief description of what story event this points to",
    "relevanceScore": 0.75,
    "artStyle": {
      "theme": "void",
      "palette": ["#1a0a2e", "#6b3fa0", "#c084fc"],
      "backgroundPrompt": "Description for DALL-E background art",
      "textStyle": "rune"
    }
  }
]

Generate ${req.count} prophecies now:`
  }

  private parseGeneratedProphecies(
    raw: string,
    req: ProphecyGenerationRequest,
  ): GeneratedProphecy[] {
    let parsed: Array<{
      text: string
      targetEvent: string
      relevanceScore: number
      artStyle: ProphecyArtStyle
    }>

    try {
      parsed = JSON.parse(raw)
    } catch {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('ProphecyGenerator: failed to parse AI output')
      parsed = JSON.parse(jsonMatch[0])
    }

    return parsed.slice(0, req.count).map((item) => {
      // Seal the prophecy text as a keccak256 hash for on-chain commitment
      const contentHash = keccak256(
        encodeAbiParameters(parseAbiParameters('string'), [item.text])
      ) as `0x${string}`

      return {
        text:          item.text,
        contentHash,
        targetEvent:   item.targetEvent,
        relevanceScore: item.relevanceScore ?? 0.5,
        artStyle: item.artStyle ?? {
          theme:            'void',
          palette:          ['#0a0a0f', '#1e0a3c', '#7c3aed'],
          backgroundPrompt: 'Dark cosmic void with faint star threads',
          textStyle:        'rune',
        },
      }
    })
  }
}

// ─── Utility: Batch Seal ──────────────────────────────────────────────────────

/**
 * Seal prophecy texts into keccak256 hashes for on-chain commitment.
 * Oracle seeds hashes on-chain, texts are revealed after minting closes.
 */
export function sealProphecies(texts: string[]): Array<{
  text: string
  contentHash: `0x${string}`
}> {
  return texts.map((text) => ({
    text,
    contentHash: keccak256(
      encodeAbiParameters(parseAbiParameters('string'), [text])
    ) as `0x${string}`,
  }))
}

/**
 * Build the IPFS metadata JSON for a prophecy NFT in pending state.
 */
export function buildPendingMetadata(opts: {
  prophecyId: bigint
  chapterId: bigint
  artStyle: ProphecyArtStyle
  imageURI: string
}): Record<string, unknown> {
  return {
    name:        `Void Prophecy #${opts.prophecyId} — Chapter ${opts.chapterId}`,
    description: 'A sealed prophecy from the Voidborne universe. Its truth is unknown until the chapter resolves.',
    image:       opts.imageURI,
    attributes: [
      { trait_type: 'Status',    value: 'Sealed' },
      { trait_type: 'Chapter',   value: opts.chapterId.toString() },
      { trait_type: 'Art Theme', value: opts.artStyle.theme },
      { trait_type: 'Rarity',   value: 'TBD — pending resolution' },
    ],
    voidborne: {
      prophecyId: opts.prophecyId.toString(),
      chapterId:  opts.chapterId.toString(),
      sealed:     true,
    },
  }
}

/**
 * Build the IPFS metadata JSON for a fulfilled prophecy NFT.
 */
export function buildFulfilledMetadata(opts: {
  prophecyId: bigint
  chapterId: bigint
  text: string
  mintOrder: bigint
  fulfillmentExplanation: string
  imageURI: string
}): Record<string, unknown> {
  const isMythic = opts.mintOrder <= 5n

  return {
    name: `✨ Fulfilled Prophecy #${opts.prophecyId} — Chapter ${opts.chapterId}`,
    description: `"${opts.text}"\n\n${opts.fulfillmentExplanation}`,
    image: opts.imageURI,
    attributes: [
      { trait_type: 'Status',     value: 'Fulfilled' },
      { trait_type: 'Chapter',    value: opts.chapterId.toString() },
      { trait_type: 'Rarity',     value: isMythic ? 'Mythic' : 'Legendary' },
      { trait_type: 'Mint Order', value: opts.mintOrder.toString() },
      { trait_type: 'Early Mint', value: isMythic ? 'Yes — Top 5' : 'No' },
    ],
    voidborne: {
      prophecyId:  opts.prophecyId.toString(),
      chapterId:   opts.chapterId.toString(),
      text:        opts.text,
      fulfillment: 'FULFILLED',
      mintOrder:   opts.mintOrder.toString(),
    },
  }
}
