import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('🧪 Testing database connection...')
    
    const stories = await prisma.story.findMany({
      take: 1
    })
    
    console.log(`✅ Found ${stories.length} stories`)
    if (stories.length > 0) {
      console.log(`   Story: ${stories[0].title}`)
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database error:', error)
    process.exit(1)
  }
}

test()
