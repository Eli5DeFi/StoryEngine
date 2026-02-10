/**
 * Database seed script
 * Creates sample data for development/testing
 */

import { PrismaClient, StoryStatus, ChapterStatus, PoolStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { walletAddress: '0x1234567890123456789012345678901234567890' },
    update: {},
    create: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'alice_crypto',
      bio: 'Love AI-generated stories and betting!',
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
      username: 'bob_trader',
      bio: 'Sci-fi enthusiast',
      totalBets: 8,
      totalWon: 42.0,
      totalLost: 18.5,
      winRate: 62.5,
    },
  })

  console.log('✅ Created users')

  // Create sample story
  const story1 = await prisma.story.create({
    data: {
      title: 'The Last Starforge',
      description: 'A derelict space station holds the secret to humanity\'s survival. But which path will the AI choose?',
      genre: 'Sci-Fi',
      coverImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800',
      status: StoryStatus.ACTIVE,
      currentChapter: 2,
      totalChapters: 2,
      authorId: user1.id,
      isAIGenerated: true,
      totalReaders: 847,
      totalBets: 142500,
      viewCount: 3241,
    },
  })

  console.log('✅ Created story:', story1.title)

  // Create Chapter 1 (completed)
  const chapter1 = await prisma.chapter.create({
    data: {
      storyId: story1.id,
      chapterNumber: 1,
      title: 'Discovery',
      content: `Captain Elena Rodriguez stared at the viewport as the massive structure loomed before them. The Starforge Station, humanity's last hope, had been silent for twenty years.

"Reading anomalous energy signatures," reported her AI companion, ARIA. "The station's core is still active."

Elena made her first critical decision: investigate the core immediately, or secure the outer decks first?

The choice would change everything.`,
      summary: 'Captain Rodriguez discovers the abandoned Starforge Station and faces her first major decision.',
      headerImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
      wordCount: 87,
      readTime: 1,
      status: ChapterStatus.RESOLVED,
      publishedAt: new Date('2026-02-08'),
      aiModel: 'gpt-4',
      generationTime: 3200,
    },
  })

  // Create choices for Chapter 1 (resolved)
  const choice1_1 = await prisma.choice.create({
    data: {
      chapterId: chapter1.id,
      choiceNumber: 1,
      text: 'Investigate the core immediately',
      description: 'Time is critical. Go straight to the energy source.',
      isChosen: true,
      chosenAt: new Date('2026-02-09'),
      aiScore: 75.3,
      aiReasoning: 'The energy signature suggests active systems. Direct investigation maximizes story tension and reveals critical plot elements.',
      totalBets: 57000,
      betCount: 342,
      oddsSnapshot: 1.42,
    },
  })

  const choice1_2 = await prisma.choice.create({
    data: {
      chapterId: chapter1.id,
      choiceNumber: 2,
      text: 'Secure the outer decks first',
      description: 'Play it safe. Establish a defensive perimeter.',
      isChosen: false,
      aiScore: 45.7,
      aiReasoning: 'While tactically sound, this approach slows narrative momentum and delays key revelations.',
      totalBets: 85500,
      betCount: 505,
      oddsSnapshot: 0.95,
    },
  })

  console.log('✅ Created Chapter 1 with choices')

  // Create Chapter 2 (active betting)
  const chapter2 = await prisma.chapter.create({
    data: {
      storyId: story1.id,
      chapterNumber: 2,
      title: 'The Core',
      content: `The core chamber pulsed with ethereal light. At its center, a crystalline structure thrummed with power—and something was trapped inside.

"It's alive," ARIA whispered. "Captain, this isn't a power source. It's a prison."

The entity within the crystal seemed to sense Elena's presence. It reached out, offering knowledge—the secrets of the Starforge, the fate of humanity, everything.

But at what cost?`,
      summary: 'Elena discovers the core holds a mysterious entity offering forbidden knowledge.',
      headerImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200',
      wordCount: 93,
      readTime: 1,
      status: ChapterStatus.BETTING,
      publishedAt: new Date('2026-02-09'),
      aiModel: 'gpt-4',
      generationTime: 2800,
    },
  })

  // Create betting pool for Chapter 2 (active)
  const pool2 = await prisma.bettingPool.create({
    data: {
      chapterId: chapter2.id,
      minBet: 0.001,
      maxBet: 100,
      opensAt: new Date('2026-02-09T12:00:00Z'),
      closesAt: new Date('2026-02-10T18:00:00Z'), // Closes in ~2.5 hours
      status: PoolStatus.OPEN,
      totalPool: 142500,
      totalBets: 847,
      uniqueBettors: 623,
      contractAddress: '0x3456789012345678901234567890123456789012',
    },
  })

  // Create choices for Chapter 2 (active betting)
  const choice2_1 = await prisma.choice.create({
    data: {
      chapterId: chapter2.id,
      choiceNumber: 1,
      text: 'Accept the entity\'s offer',
      description: 'Gain knowledge of the Starforge, but at an unknown price.',
      totalBets: 57000,
      betCount: 340,
    },
  })

  const choice2_2 = await prisma.choice.create({
    data: {
      chapterId: chapter2.id,
      choiceNumber: 2,
      text: 'Refuse and study it from outside',
      description: 'Play it safe. Don\'t make deals with unknown entities.',
      totalBets: 85500,
      betCount: 507,
    },
  })

  console.log('✅ Created Chapter 2 with active betting pool')

  // Create sample bets
  await prisma.bet.createMany({
    data: [
      {
        userId: user1.id,
        poolId: pool2.id,
        choiceId: choice2_1.id,
        amount: 10.5,
        odds: 2.5,
        txHash: '0xabc123...',
      },
      {
        userId: user2.id,
        poolId: pool2.id,
        choiceId: choice2_2.id,
        amount: 5.0,
        odds: 1.67,
        txHash: '0xdef456...',
      },
    ],
  })

  console.log('✅ Created sample bets')

  // Create analytics entry for today
  await prisma.analytics.create({
    data: {
      date: new Date(),
      activeUsers: 847,
      newUsers: 123,
      storiesCreated: 3,
      chaptersPublished: 5,
      totalBets: 847,
      totalVolume: 142500,
      uniqueBettors: 623,
      platformFees: 21375,
      tradingFees: 427.5,
      aiCalls: 45,
      aiCost: 12.35,
    },
  })

  console.log('✅ Created analytics')

  // Create AI generation logs
  await prisma.aIGeneration.createMany({
    data: [
      {
        type: 'CHAPTER_CONTENT',
        entityId: chapter1.id,
        entityType: 'chapter',
        model: 'gpt-4',
        provider: 'OpenAI',
        prompt: 'Generate a sci-fi chapter about discovering an abandoned space station...',
        response: chapter1.content,
        tokensUsed: 450,
        cost: 0.0135,
        latency: 3200,
        status: 'success',
      },
      {
        type: 'AI_DECISION',
        entityId: choice1_1.id,
        entityType: 'choice',
        model: 'claude-3',
        provider: 'Anthropic',
        prompt: 'Analyze these story choices and pick the best narrative path...',
        response: JSON.stringify({
          chosen: 1,
          reasoning: choice1_1.aiReasoning,
          score: choice1_1.aiScore,
        }),
        tokensUsed: 890,
        cost: 0.0267,
        latency: 2100,
        status: 'success',
      },
    ],
  })

  console.log('✅ Created AI generation logs')

  console.log('\n🎉 Seed completed!')
  console.log('\nCreated:')
  console.log('  - 2 users')
  console.log('  - 1 story (The Last Starforge)')
  console.log('  - 2 chapters')
  console.log('  - 4 choices')
  console.log('  - 1 active betting pool')
  console.log('  - 2 sample bets')
  console.log('  - Analytics data')
  console.log('  - AI generation logs')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
