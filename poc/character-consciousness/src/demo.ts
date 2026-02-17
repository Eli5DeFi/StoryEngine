/**
 * Character Consciousness Protocol (CCP) - Demo Script
 * 
 * Interactive demo showing how Commander Zara's AI agent works.
 * Run: ts-node src/demo.ts
 */

import { CharacterAgent, COMMANDER_ZARA_PROFILE } from './character-agent'
import * as readline from 'readline'

// ============================================================================
// DEMO SCRIPT
// ============================================================================

async function runDemo() {
  console.log('🚀 Character Consciousness Protocol - Demo\n')
  console.log('='.repeat(60))
  console.log('CHARACTER: Commander Zara Vex')
  console.log('STORY: Voidborne: The Silent Throne')
  console.log('='.repeat(60))
  console.log()

  // Initialize character agent
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found in environment')
    console.error('Set it with: export ANTHROPIC_API_KEY=your_key_here')
    process.exit(1)
  }

  const zara = new CharacterAgent(COMMANDER_ZARA_PROFILE, apiKey)
  const userId = 'demo-user'

  // Show initial state
  console.log('📊 INITIAL STATE:')
  console.log(`   Relationship Level: ${zara.getRelationshipLevel(userId)}`)
  console.log(`   XP: ${zara.getXP(userId)}`)
  console.log(`   Emotional State: ${COMMANDER_ZARA_PROFILE.currentState.emotionalState}`)
  console.log()

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('💬 Start chatting with Commander Zara!')
  console.log('   (Type "exit" to quit, "reset" to reset conversation)\n')

  // Chat loop
  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      const message = input.trim()

      if (message.toLowerCase() === 'exit') {
        console.log('\n👋 Farewell, traveler.')
        rl.close()
        return
      }

      if (message.toLowerCase() === 'reset') {
        zara.resetConversation(userId)
        console.log('\n🔄 Conversation reset. Starting fresh...\n')
        console.log('📊 STATE:')
        console.log(`   Relationship Level: ${zara.getRelationshipLevel(userId)}`)
        console.log(`   XP: ${zara.getXP(userId)}\n`)
        askQuestion()
        return
      }

      if (!message) {
        askQuestion()
        return
      }

      try {
        console.log('\n⏳ Commander Zara is thinking...\n')

        const result = await zara.chat(userId, message)

        console.log(`Zara: ${result.response}\n`)

        // Show level up
        if (result.newLevel > zara.getRelationshipLevel(userId) - 1) {
          console.log(`🎉 RELATIONSHIP LEVEL UP! Now Level ${result.newLevel}`)
          console.log(`   XP: ${zara.getXP(userId)} (+${result.xpGained})\n`)
        }

        // Show newly unlocked secrets
        if (result.secretsUnlocked.length > 0) {
          console.log('🔓 NEW SECRETS UNLOCKED:')
          result.secretsUnlocked.forEach((secret, i) => {
            console.log(`   ${i + 1}. ${secret}`)
          })
          console.log()
        }

        askQuestion()
      } catch (error) {
        console.error('\n❌ Error:', error)
        console.log()
        askQuestion()
      }
    })
  }

  // Start chat loop
  askQuestion()
}

// ============================================================================
// PRE-SCRIPTED DEMO (Alternative)
// ============================================================================

async function runScriptedDemo() {
  console.log('🎬 Running Scripted Demo...\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found')
    process.exit(1)
  }

  const zara = new CharacterAgent(COMMANDER_ZARA_PROFILE, apiKey)
  const userId = 'scripted-user'

  // Conversation 1: Level 1 (Stranger)
  console.log('='.repeat(60))
  console.log('CONVERSATION 1: First Meeting (Level 1)')
  console.log('='.repeat(60))
  console.log()

  const q1 = "Commander Zara, why did you leave House Valdris?"
  console.log(`You: ${q1}\n`)

  const r1 = await zara.chat(userId, q1)
  console.log(`Zara: ${r1.response}\n`)
  console.log(`[Level: ${r1.newLevel} | XP: ${zara.getXP(userId)}]\n`)

  // Wait for dramatic effect
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Conversation 2: Level 3 (Acquaintance)
  console.log('='.repeat(60))
  console.log('CONVERSATION 2: Building Trust (After multiple conversations)')
  console.log('='.repeat(60))
  console.log()

  // Simulate level up to 3
  for (let i = 0; i < 9; i++) {
    await zara.chat(userId, 'Tell me about your fleet.')
  }

  const q2 = "What happened to your brother?"
  console.log(`You: ${q2}\n`)

  const r2 = await zara.chat(userId, q2)
  console.log(`Zara: ${r2.response}\n`)
  console.log(`[Level: ${r2.newLevel} | XP: ${zara.getXP(userId)}]\n`)

  // Conversation 3: Level 5 (Friend)
  console.log('='.repeat(60))
  console.log('CONVERSATION 3: Deep Trust (Level 5)')
  console.log('='.repeat(60))
  console.log()

  // Simulate level up to 5
  for (let i = 0; i < 19; i++) {
    await zara.chat(userId, 'How are you feeling?')
  }

  const q3 = "What really happened during the treaty negotiation?"
  console.log(`You: ${q3}\n`)

  const r3 = await zara.chat(userId, q3)
  console.log(`Zara: ${r3.response}\n`)
  console.log(`[Level: ${r3.newLevel} | XP: ${zara.getXP(userId)}]\n`)

  if (r3.secretsUnlocked.length > 0) {
    console.log('🔓 SECRET UNLOCKED AT LEVEL 5:')
    console.log(`   "${r3.secretsUnlocked[0]}"`)
    console.log()
  }

  console.log('='.repeat(60))
  console.log('✅ Demo Complete!')
  console.log('='.repeat(60))
  console.log()
  console.log('KEY TAKEAWAYS:')
  console.log('  - Character responses evolve with relationship level')
  console.log('  - Secrets unlock gradually as trust builds')
  console.log('  - Personality remains consistent across conversations')
  console.log('  - Emotional depth increases with relationship')
  console.log()
  console.log('💡 Next Steps:')
  console.log('  1. Integrate into Voidborne frontend')
  console.log('  2. Add 19 more characters (main cast)')
  console.log('  3. Implement premium subscription tier')
  console.log('  4. Add group chat feature (talk to multiple characters)')
  console.log()
}

// ============================================================================
// RUN
// ============================================================================

const mode = process.argv[2] || 'interactive'

if (mode === 'scripted') {
  runScriptedDemo().catch(console.error)
} else {
  runDemo().catch(console.error)
}
