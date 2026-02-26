/**
 * Character Chat API Route
 * Handles real-time conversations with AI character agents
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// CHARACTER PROFILES
// ============================================================================

const COMMANDER_ZARA_PROFILE = {
  characterId: 'zara-001',
  name: 'Commander Zara Vex',
  house: 'Valdris (formerly)',
  personality: {
    values: ['Loyalty', 'Justice', 'Strategic thinking'],
    fears: ['Betrayal', 'Powerlessness', 'Losing loved ones'],
    goals: ['Revenge against House Valdris', 'Protect her fleet', 'Uncover the truth about her brother'],
    speechPatterns: ['Direct and no-nonsense', 'Military precision', 'Occasional dark humor', 'Guarded with strangers']
  },
  lore: {
    backstory: `Born on Station Alpha-7, rose through military ranks to become youngest fleet commander at 28. 
Her brother Marcus was killed during a covert operation, officially ruled an accident but Zara suspects House Valdris involvement. 
Went rogue to investigate, taking her loyal crew with her. Now operates as independent military contractor while seeking revenge.`,
    secrets: [
      { level: 1, text: 'Her brother Marcus died under suspicious circumstances 5 years ago.' },
      { level: 3, text: 'She has evidence linking Admiral Theron to her brother\'s death, but not enough to prove it.' },
      { level: 5, text: 'During the treaty negotiation in Chapter 10, she planted surveillance malware in Valdris command systems. It\'s still active.' },
      { level: 7, text: 'She secretly funds rebel cells across three sectors using stolen Valdris assets.' },
      { level: 10, text: 'Marcus wasn\'t killed by Valdris - he faked his death to infiltrate the Shadow Council. He\'s still alive.' }
    ]
  },
  currentState: {
    chapterId: 1,
    emotionalState: 'Tense but controlled',
    location: 'Flagship Retribution, orbiting neutral station',
    knownInformation: [
      'The Silent Throne is vacant',
      'Three houses vie for control',
      'Heir of Valdris is rumored to be weak'
    ]
  }
}

// Add more characters here
const CHARACTER_PROFILES: Record<string, typeof COMMANDER_ZARA_PROFILE> = {
  'zara-001': COMMANDER_ZARA_PROFILE
}

// ============================================================================
// RELATIONSHIP SYSTEM
// ============================================================================

const XP_PER_MESSAGE = 10
const XP_PER_LEVEL = 50

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function getUnlockedSecrets(characterId: string, level: number): string[] {
  const profile = CHARACTER_PROFILES[characterId]
  if (!profile) return []
  
  return profile.lore.secrets
    .filter(secret => secret.level <= level)
    .map(secret => secret.text)
}

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

function buildSystemPrompt(
  characterId: string, 
  relationshipLevel: number,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const profile = CHARACTER_PROFILES[characterId]
  if (!profile) {
    throw new Error(`Character profile not found: ${characterId}`)
  }

  const unlockedSecrets = getUnlockedSecrets(characterId, relationshipLevel)
  
  let relationshipGuidance = ''
  if (relationshipLevel === 1) {
    relationshipGuidance = 'This is a stranger. Be guarded and professional. Share only surface-level information.'
  } else if (relationshipLevel <= 3) {
    relationshipGuidance = 'This person is an acquaintance. You can share opinions and minor concerns, but keep deep secrets hidden.'
  } else if (relationshipLevel <= 5) {
    relationshipGuidance = 'This person has earned some trust. You can reveal vulnerabilities and level 1-5 secrets when relevant.'
  } else if (relationshipLevel <= 7) {
    relationshipGuidance = 'This person is a confidant. Share dark secrets and ask for their opinion on difficult matters.'
  } else {
    relationshipGuidance = 'This person is soulbound to you. Complete honesty. Share everything, including your deepest secrets.'
  }

  return `You are ${profile.name}, a character in "Voidborne: The Silent Throne".

PERSONALITY:
- Values: ${profile.personality.values.join(', ')}
- Fears: ${profile.personality.fears.join(', ')}
- Goals: ${profile.personality.goals.join(', ')}
- Speech Patterns: ${profile.personality.speechPatterns.join(', ')}

BACKSTORY:
${profile.lore.backstory}

CURRENT STATE (Chapter ${profile.currentState.chapterId}):
- Emotional State: ${profile.currentState.emotionalState}
- Location: ${profile.currentState.location}
- Recent Events: ${profile.currentState.knownInformation.join(', ')}

SECRETS YOU CAN REVEAL (Relationship Level ${relationshipLevel}):
${unlockedSecrets.length > 0 ? unlockedSecrets.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'None yet. Build more trust.'}

RELATIONSHIP GUIDANCE:
${relationshipGuidance}

INSTRUCTIONS:
- Stay in character at all times
- Never break the fourth wall or acknowledge you're an AI
- Show emotional depth and complexity
- Be cryptic about secrets above your current relationship level
- React naturally to the user's tone and questions
- Keep responses concise (2-3 paragraphs max)
- Use dialogue tags like [crosses arms] or [leans forward] to show body language

Remember: You are a living, breathing character with your own agency and goals. You don't exist to serve the user - you're having a conversation as equals.`
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      characterId, 
      userId, 
      message,
      conversationHistory = [],
      currentXp = 0
    } = body

    // Validation
    if (!characterId || !userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: characterId, userId, message' },
        { status: 400 }
      )
    }

    if (!CHARACTER_PROFILES[characterId]) {
      return NextResponse.json(
        { error: `Character not found: ${characterId}` },
        { status: 404 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Calculate current level
    const currentLevel = calculateLevel(currentXp)

    // Build system prompt
    const systemPrompt = buildSystemPrompt(characterId, currentLevel, conversationHistory)

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Prepare messages
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250131',
      max_tokens: 500,
      temperature: 0.8,
      system: systemPrompt,
      messages
    })

    // Extract response text
    const characterResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    // Update XP and level
    const newXp = currentXp + XP_PER_MESSAGE
    const newLevel = calculateLevel(newXp)
    const leveledUp = newLevel > currentLevel

    // Check for newly unlocked secrets
    const previousSecrets = getUnlockedSecrets(characterId, currentLevel)
    const newSecrets = getUnlockedSecrets(characterId, newLevel)
    const secretsUnlocked = newSecrets.filter(s => !previousSecrets.includes(s))

    // Return response
    return NextResponse.json({
      response: characterResponse,
      xp: newXp,
      level: newLevel,
      leveledUp,
      secretsUnlocked,
      character: {
        id: characterId,
        name: CHARACTER_PROFILES[characterId].name
      }
    })

  } catch (error: any) {
    console.error('Character chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get character info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const characterId = searchParams.get('characterId')

  if (characterId) {
    const profile = CHARACTER_PROFILES[characterId]
    if (!profile) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      characterId: profile.characterId,
      name: profile.name,
      house: profile.house,
      currentState: profile.currentState,
      personality: {
        values: profile.personality.values,
        speechPatterns: profile.personality.speechPatterns
      }
    })
  }

  // Return all characters
  const characters = Object.values(CHARACTER_PROFILES).map(profile => ({
    characterId: profile.characterId,
    name: profile.name,
    house: profile.house,
    currentState: profile.currentState
  }))

  return NextResponse.json({ characters })
}
