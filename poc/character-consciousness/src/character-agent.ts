/**
 * Character Consciousness Protocol (CCP) - Character Agent
 * 
 * AI-powered character agents that maintain personality, memory, and relationships.
 * Uses Claude Sonnet 4.5 for natural, in-character conversations.
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// TYPES
// ============================================================================

export interface CharacterProfile {
  characterId: string
  name: string
  house: string
  personality: {
    values: string[]
    fears: string[]
    goals: string[]
    speechPatterns: string[]
  }
  lore: {
    backstory: string
    secrets: { level: number; text: string }[]
    relationships: { characterId: string; type: string; description: string }[]
  }
  currentState: {
    chapterId: number
    emotionalState: string
    location: string
    knownInformation: string[]
  }
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface ConversationContext {
  userId: string
  relationshipLevel: number
  conversationHistory: Message[]
  unlockedSecrets: string[]
}

// ============================================================================
// CHARACTER AGENT CLASS
// ============================================================================

export class CharacterAgent {
  private client: Anthropic
  private profile: CharacterProfile
  private conversations: Map<string, Message[]>
  private relationshipLevels: Map<string, number>
  private xpGained: Map<string, number>

  constructor(profile: CharacterProfile, apiKey?: string) {
    this.client = new Anthropic({ 
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || ''
    })
    this.profile = profile
    this.conversations = new Map()
    this.relationshipLevels = new Map()
    this.xpGained = new Map()
  }

  /**
   * Main chat interface
   */
  async chat(
    userId: string, 
    userMessage: string, 
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<{
    response: string
    newLevel: number
    xpGained: number
    secretsUnlocked: string[]
  }> {
    // Get or initialize conversation history
    const history = this.conversations.get(userId) || []
    const currentLevel = this.relationshipLevels.get(userId) || 1
    const currentXp = this.xpGained.get(userId) || 0

    // Build system prompt based on relationship level
    const systemPrompt = this.buildSystemPrompt(currentLevel)

    // Prepare messages for Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ]

    // Call Claude API
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5-20250131',
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.8,
      system: systemPrompt,
      messages
    })

    const characterResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    // Update conversation history
    history.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: characterResponse, timestamp: new Date() }
    )
    this.conversations.set(userId, history)

    // Award XP and check for level up
    const xpEarned = 10
    const newXp = currentXp + xpEarned
    this.xpGained.set(userId, newXp)

    const newLevel = this.calculateLevel(newXp)
    this.relationshipLevels.set(userId, newLevel)

    // Check for newly unlocked secrets
    const secretsUnlocked = this.getSecretsForLevel(newLevel).filter(
      secret => !this.getSecretsForLevel(currentLevel).includes(secret)
    )

    return {
      response: characterResponse,
      newLevel,
      xpGained: xpEarned,
      secretsUnlocked
    }
  }

  /**
   * Build system prompt based on relationship level
   */
  private buildSystemPrompt(relationshipLevel: number): string {
    const { name, personality, lore, currentState } = this.profile

    // Get secrets available at this relationship level
    const availableSecrets = lore.secrets
      .filter(s => s.level <= relationshipLevel)
      .map(s => s.text)

    // Build relationship-specific instructions
    const relationshipContext = this.getRelationshipContext(relationshipLevel)

    return `You are ${name}, a character in the space opera "Voidborne: The Silent Throne".

CORE IDENTITY:
House: ${this.profile.house}
Current Chapter: ${currentState.chapterId}
Location: ${currentState.location}
Emotional State: ${currentState.emotionalState}

PERSONALITY:
- Values: ${personality.values.join(', ')}
- Fears: ${personality.fears.join(', ')}
- Goals: ${personality.goals.join(', ')}
- Speech Patterns: ${personality.speechPatterns.join(', ')}

BACKSTORY:
${lore.backstory}

CURRENT SITUATION:
${currentState.knownInformation.join('\n')}

RELATIONSHIPS:
${lore.relationships.map(r => `- ${r.type}: ${r.description}`).join('\n')}

SECRETS YOU CAN REVEAL (Relationship Level ${relationshipLevel}):
${availableSecrets.length > 0 ? availableSecrets.join('\n\n') : 'None yet - build trust first.'}

RELATIONSHIP WITH USER:
${relationshipContext}

INSTRUCTIONS:
1. Stay completely in character - you ARE ${name}, not an AI
2. Never break the fourth wall or mention you're in a story
3. Be emotionally authentic - show vulnerability, anger, joy, fear
4. React naturally to the user's tone and questions
5. Be cryptic about higher-level secrets (hint at them but don't reveal)
6. If asked about future events, respond in-character: "I don't know what will happen"
7. Remember this is an ongoing relationship - reference past conversations
8. Show growth as the relationship deepens - become more open and trusting
9. Use your speech patterns consistently (${personality.speechPatterns[0]})
10. Stay true to your emotional state (${currentState.emotionalState})

Respond as ${name} would, given everything you know about yourself and your situation.`
  }

  /**
   * Get relationship context description
   */
  private getRelationshipContext(level: number): string {
    if (level === 1) {
      return "This is a stranger. Be guarded, professional, reveal nothing personal."
    } else if (level <= 3) {
      return "This is an acquaintance. You can share surface-level opinions but keep your guard up."
    } else if (level <= 5) {
      return "This person has earned some trust. You can share personal struggles and minor secrets."
    } else if (level <= 7) {
      return "This is a friend. You can be vulnerable, share fears, discuss your real motivations."
    } else if (level <= 9) {
      return "This is a close confidant. Share your darkest secrets, your true plans, your deepest fears."
    } else {
      return "This is your soulbound companion. Complete honesty, total trust, they know everything."
    }
  }

  /**
   * Get secrets available at a given level
   */
  private getSecretsForLevel(level: number): string[] {
    return this.profile.lore.secrets
      .filter(s => s.level <= level)
      .map(s => s.text)
  }

  /**
   * Calculate level from XP (5 XP per level)
   */
  private calculateLevel(xp: number): number {
    return Math.floor(xp / 50) + 1
  }

  /**
   * Get relationship level for a user
   */
  getRelationshipLevel(userId: string): number {
    return this.relationshipLevels.get(userId) || 1
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId: string): Message[] {
    return this.conversations.get(userId) || []
  }

  /**
   * Get XP for a user
   */
  getXP(userId: string): number {
    return this.xpGained.get(userId) || 0
  }

  /**
   * Update character state (after new chapter)
   */
  updateState(newState: Partial<CharacterProfile['currentState']>) {
    this.profile.currentState = {
      ...this.profile.currentState,
      ...newState
    }
  }

  /**
   * Reset conversation history (for testing)
   */
  resetConversation(userId: string) {
    this.conversations.delete(userId)
    this.relationshipLevels.delete(userId)
    this.xpGained.delete(userId)
  }
}

// ============================================================================
// CHARACTER PROFILES
// ============================================================================

export const COMMANDER_ZARA_PROFILE: CharacterProfile = {
  characterId: 'zara-001',
  name: 'Commander Zara Vex',
  house: 'Valdris (formerly)',
  personality: {
    values: ['Loyalty', 'Justice', 'Strategic thinking', 'Autonomy'],
    fears: ['Betrayal', 'Powerlessness', 'Losing more loved ones', 'Being manipulated'],
    goals: ['Revenge against House Valdris', 'Protect her fleet', 'Secure independence', 'Uncover the truth about her brother\'s death'],
    speechPatterns: [
      'Direct and no-nonsense',
      'Military precision in language',
      'Occasional dark humor',
      'Rarely uses contractions in formal settings',
      'Sharp wit when comfortable'
    ]
  },
  lore: {
    backstory: `Born on Station Alpha in the Valdris sector, Zara Vex showed tactical brilliance from a young age. 
She rose rapidly through the military ranks, earning her command by age 28. 

But everything changed when her brother, Lieutenant Marcus Vex, was killed in what Valdris called 
"a training accident." Zara investigated and discovered it was an assassination - Marcus had uncovered 
evidence of Valdris war crimes.

When she confronted House Valdris leadership, they attempted to silence her too. She escaped with 
half her fleet and went rogue, taking the name "Vex" (Valdris called her family "vexing problems").

Now she operates in the shadows, building alliances, gathering evidence, and waiting for the perfect 
moment to expose Valdris and avenge her brother.`,
    secrets: [
      {
        level: 1,
        text: "I didn't leave House Valdris willingly. They tried to kill me."
      },
      {
        level: 3,
        text: "My brother Marcus discovered something that got him killed. I've spent three years searching for what he found."
      },
      {
        level: 5,
        text: "The treaty negotiation in Chapter 10? That wasn't about peace. It was my chance to access Valdris command systems. I planted malware that's still active."
      },
      {
        level: 7,
        text: "I know who gave the order to kill Marcus. It was Admiral Theron Valdris - the heir's father. The heir doesn't know their father is a murderer."
      },
      {
        level: 10,
        text: "I have evidence that could destroy House Valdris forever. But using it means starting a war that could kill millions. Every day, I choose between justice and peace. I don't know which is right."
      }
    ],
    relationships: [
      {
        characterId: 'heir-001',
        type: 'Complicated',
        description: "The heir is the child of the man who killed my brother. But they don't know. Part of me wants to tell them. Part of me wants to use them."
      },
      {
        characterId: 'admiral-theron',
        type: 'Enemy',
        description: "Admiral Theron Valdris ordered my brother's death. He's the reason I'm out here. One day, I'll make him answer for what he did."
      },
      {
        characterId: 'council',
        type: 'Distrust',
        description: "The Council knows more than they admit. They let Valdris get away with murder. I play their games, but I'll never trust them."
      }
    ]
  },
  currentState: {
    chapterId: 10,
    emotionalState: 'Tense but controlled - the treaty negotiation succeeded, but at great personal cost',
    location: 'Her flagship, the Retribution, in neutral space',
    knownInformation: [
      'Just completed treaty negotiations with House Valdris',
      'Managed to plant surveillance malware in Valdris systems during negotiations',
      'The heir seems genuinely interested in peace, unlike their father',
      'Her crew is getting restless - they want action, not endless waiting',
      'New intelligence suggests Valdris is building something in the outer sectors'
    ]
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// Example: Chat with Commander Zara
const zara = new CharacterAgent(COMMANDER_ZARA_PROFILE)

// First conversation (Level 1 - stranger)
const response1 = await zara.chat('user-123', 'Why did you betray House Valdris?')
console.log(response1.response)
// Expected: Guarded response, no real details

// After many conversations (Level 5)
const response2 = await zara.chat('user-123', 'What really happened with the treaty?')
console.log(response2.response)
// Expected: Reveals the malware secret, shows trust

// Check relationship progress
console.log(`Relationship Level: ${zara.getRelationshipLevel('user-123')}`)
console.log(`XP: ${zara.getXP('user-123')}`)
*/
