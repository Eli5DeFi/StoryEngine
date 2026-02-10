/**
 * Voidborne Agent SDK - Quick Examples
 * 
 * Install: npm install @voidborne/agent-sdk
 */

import { VoidborneSDK } from './src/index'

async function main() {
  // ========== READ-ONLY MODE ==========
  console.log('📖 Read-only mode (no private key needed)\n')
  
  const sdk = new VoidborneSDK({ network: 'testnet' })

  // Get the main story
  const story = await sdk.getVoidborneStory()
  console.log(`Story: ${story.title}`)
  console.log(`Genre: ${story.genre}`)
  console.log(`Progress: Chapter ${story.currentChapter}/${story.totalChapters}\n`)

  // Get current chapter
  const currentChapter = story.chapters[story.currentChapter - 1]
  console.log(`Chapter ${currentChapter.chapterNumber}: ${currentChapter.title}`)
  console.log(`Content preview: ${currentChapter.content.slice(0, 200)}...\n`)

  // Show choices
  console.log('Choices:')
  currentChapter.choices.forEach(choice => {
    console.log(`  ${choice.order}. ${choice.text}`)
  })
  console.log()

  // Check betting pool
  if (currentChapter.bettingPool) {
    const pool = await sdk.getBettingPool(currentChapter.bettingPool.id)
    console.log(`💰 Betting Pool:`)
    console.log(`  Total wagered: $${pool.totalAmount}`)
    console.log(`  Status: ${pool.status}`)
    console.log(`  Deadline: ${new Date(pool.deadline).toLocaleString()}`)
    console.log()

    // Calculate and show odds
    const odds = sdk.calculateOdds(pool)
    console.log('📊 Odds by choice:')
    pool.choicePools.forEach(cp => {
      const choice = currentChapter.choices.find(c => c.id === cp.choiceId)
      console.log(`  ${choice?.text}: ${odds[cp.choiceId].toFixed(2)}x ($${cp.amount} pool)`)
    })
    console.log()

    // Find best value
    const best = sdk.findBestValue(pool)
    if (best) {
      const bestChoice = currentChapter.choices.find(c => c.id === best.choiceId)
      console.log(`🎯 Best value: "${bestChoice?.text}" (EV: ${best.ev.toFixed(2)}x)`)
    }
  }

  // ========== BETTING MODE ==========
  // Uncomment to test betting (requires private key in .env)
  /*
  console.log('\n💸 Betting mode (requires private key)\n')
  
  const bettingSDK = new VoidborneSDK({
    network: 'testnet',
    privateKey: process.env.PRIVATE_KEY as `0x${string}`
  })

  const result = await bettingSDK.placeBet({
    poolId: currentChapter.bettingPool!.id,
    choiceId: currentChapter.choices[0].id,
    amount: '10' // $10 USDC
  })

  if (result.success) {
    console.log(`✅ Bet placed! TX: ${result.hash}`)
  } else {
    console.log(`❌ Bet failed: ${result.error}`)
  }
  */
}

main().catch(console.error)
