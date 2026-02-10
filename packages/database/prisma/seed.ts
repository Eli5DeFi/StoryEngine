/**
 * Database seed script - VOIDBORNE: The Silent Throne
 * Creates Voidborne story data for development/testing
 */

import { PrismaClient, StoryStatus, ChapterStatus, PoolStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Voidborne database...')

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { walletAddress: '0x1234567890123456789012345678901234567890' },
    update: {},
    create: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'thread_weaver',
      bio: 'House Valdris supporter. Long live the Silent Throne!',
      totalBets: 15,
      totalWon: 125.5,
      totalLost: 45.2,
      winRate: 73.5,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { walletAddress: '0x2345678901234567890123456789012345678901' },
    update: {},
    create: {
      walletAddress: '0x2345678901234567890123456789012345678901',
      username: 'void_walker',
      bio: 'Political intrigue enthusiast',
      totalBets: 8,
      totalWon: 42.0,
      totalLost: 18.5,
      winRate: 62.5,
    },
  })

  console.log('✅ Created users')

  // Create VOIDBORNE story
  const voidborne = await prisma.story.create({
    data: {
      title: 'VOIDBORNE: The Silent Throne',
      description: 'Heir to House Valdris, you must navigate deadly succession politics as someone learns to Stitch new Threads—an art thought impossible. Five perspectives. Five agendas. One choice that could shatter reality.',
      genre: 'Space Political Sci-Fi',
      coverImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      status: StoryStatus.ACTIVE,
      currentChapter: 1,
      totalChapters: 1,
      authorId: user1.id,
      isAIGenerated: true,
      totalReaders: 0,
      totalBets: 0,
      viewCount: 0,
    },
  })

  console.log('✅ Created story: VOIDBORNE')

  // Create Chapter 1 (active betting)
  const chapter1 = await prisma.chapter.create({
    data: {
      storyId: voidborne.id,
      chapterNumber: 1,
      title: 'Succession',
      content: `The Grand Conclave chamber stretched before you—five hundred pillars of obsidian glass, each pulsing with the lifeblood of a noble house. Yours, House Valdris, stood at the center: the Silent Throne, empty for three generations, waiting for an heir who could master what your ancestors abandoned.

The art of Stitching new Threads.

"You feel it, don't you?" Taelyn Korr stepped from the shadows, her diplomat's robes shimmering like oil on water. Her house controlled the trade routes between the Inner Spiral and the Fringe—words were her weapons. "The way reality… shifts. When you breathe wrong. When you think too loud."

You'd felt it since childhood. The world fracturing at the edges when you weren't careful. But the old texts said new Threads couldn't be Stitched—only ancient ones could be pulled and woven. Creating new ones was theoretically impossible.

Someone was proving theory wrong.

"The Conclave demands an answer," she continued. "Someone is ripping holes in the fabric. New Threads where none should exist. If it's House Valdris…" She didn't finish. Didn't need to. If your house was responsible, the other four would unite and glass your homeworld.

Behind her, General Vex Hadron watched with the patience of a black hole. His house, Hadron, commanded the Void Fleets. He didn't speak—he calculated. Three wars, zero losses. You'd studied his campaigns. Every word he said was a test.

Brother Kaelen, head of House Solenne, stood apart—his robes bore the Mark of the Ascended. His house had rejected technology for faith, building cathedrals in the void where hymns echoed across light-years. He believed the new Threads were divine intervention. Or heresy. You couldn't tell which he feared more.

Dr. Orin Sable adjusted his neural interface—House Sable's finest mind. If there was a scientific explanation for the new Threads, he'd find it. Or weaponize it. Both, probably.

Five houses. Five perspectives. Five agendas.

And you, heir to the Silent Throne, at the center of it all.

"So tell us," Taelyn's smile was a razor. "What does House Valdris propose?"`,
      summary: 'You stand before the Grand Conclave as heir to House Valdris. Someone is Stitching new Threads—an impossible act. Five houses demand answers, each with their own agenda.',
      headerImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200',
      wordCount: 387,
      readTime: 2,
      status: ChapterStatus.BETTING,
      publishedAt: new Date(),
      aiModel: 'gpt-4',
      generationTime: 4500,
    },
  })

  // Create betting pool for Chapter 1 (active)
  const pool1 = await prisma.bettingPool.create({
    data: {
      chapterId: chapter1.id,
      betToken: 'USDC',
      betTokenAddress: '0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132', // Mock USDC on Base Sepolia
      minBet: 10, // 10 USDC
      maxBet: 10000, // 10,000 USDC
      opensAt: new Date(),
      closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: PoolStatus.OPEN,
      totalPool: 0,
      totalBets: 0,
      uniqueBettors: 0,
      contractAddress: '0xD4C57AC117670C8e1a8eDed3c05421d404488123', // Deployed ChapterBettingPool
    },
  })

  // Create choices for Chapter 1 (active betting)
  const choice1 = await prisma.choice.create({
    data: {
      chapterId: chapter1.id,
      choiceNumber: 1,
      text: 'Claim responsibility—demonstrate the art',
      description: 'Reveal that House Valdris can Stitch new Threads. Show them it\'s controlled, not chaos. Risk: They might see you as a threat.',
      totalBets: 0,
      betCount: 0,
    },
  })

  const choice2 = await prisma.choice.create({
    data: {
      chapterId: chapter1.id,
      choiceNumber: 2,
      text: 'Deny involvement—investigate quietly',
      description: 'Buy time. Suggest a joint investigation while you figure out what\'s really happening. Risk: If they discover you\'re lying, you lose all credibility.',
      totalBets: 0,
      betCount: 0,
    },
  })

  const choice3 = await prisma.choice.create({
    data: {
      chapterId: chapter1.id,
      choiceNumber: 3,
      text: 'Propose an alliance—whoever is doing this is a threat to all houses',
      description: 'Unite the Conclave against the unknown Stitcher. Risk: You might be allying with the culprit.',
      totalBets: 0,
      betCount: 0,
    },
  })

  console.log('✅ Created Chapter 1 with 3 choices and active betting pool')

  // Create analytics entry for today
  await prisma.analytics.create({
    data: {
      date: new Date(),
      activeUsers: 0,
      newUsers: 0,
      storiesCreated: 1,
      chaptersPublished: 1,
      totalBets: 0,
      totalVolume: 0,
      uniqueBettors: 0,
      platformFees: 0,
      tradingFees: 0,
      aiCalls: 1,
      aiCost: 0.25,
    },
  })

  console.log('✅ Created analytics')

  // Create AI generation log
  await prisma.aIGeneration.create({
    data: {
      type: 'CHAPTER_CONTENT',
      entityId: chapter1.id,
      entityType: 'chapter',
      model: 'gpt-4',
      provider: 'OpenAI',
      prompt: 'Generate Chapter 1 of VOIDBORNE: The Silent Throne...',
      response: chapter1.content,
      tokensUsed: 850,
      cost: 0.0255,
      latency: 4500,
      status: 'success',
    },
  })

  console.log('✅ Created AI generation logs')

  console.log('\n🎉 Seed completed!')
  console.log('\nCreated:')
  console.log('  - 2 users')
  console.log('  - 1 story (VOIDBORNE: The Silent Throne)')
  console.log('  - 1 chapter (Succession)')
  console.log('  - 3 choices')
  console.log('  - 1 active betting pool')
  console.log('  - Analytics data')
  console.log('  - AI generation logs')
  console.log('\n📖 Story ID: ' + voidborne.id)
  console.log('🎲 Betting Pool: ' + pool1.contractAddress)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
