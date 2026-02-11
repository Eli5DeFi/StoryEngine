import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@voidborne/database'

const Decimal = Prisma.Decimal
type Decimal = Prisma.Decimal

/**
 * GET /api/share/referral?code={code}
 * 
 * Validate referral code and get referrer info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 })
    }

    // Find user by referral code (we'll use wallet address as code for now)
    const referrer = await prisma.user.findUnique({
      where: { walletAddress: code },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        avatar: true,
        totalBets: true,
        winRate: true,
      },
    })

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    return NextResponse.json({
      referrer: {
        id: referrer.id,
        username:
          referrer.username ||
          `${referrer.walletAddress.slice(0, 6)}...${referrer.walletAddress.slice(-4)}`,
        avatar: referrer.avatar,
        totalBets: referrer.totalBets,
        winRate: referrer.winRate,
      },
    })
  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json({ error: 'Failed to validate referral' }, { status: 500 })
  }
}

/**
 * POST /api/share/referral
 * 
 * Record a referral (when new user signs up with code)
 * 
 * Body:
 * {
 *   referrerAddress: string,
 *   newUserAddress: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { referrerAddress, newUserAddress } = await request.json()

    if (!referrerAddress || !newUserAddress) {
      return NextResponse.json(
        { error: 'Missing referrerAddress or newUserAddress' },
        { status: 400 }
      )
    }

    // Check if users exist
    const [referrer, newUser] = await Promise.all([
      prisma.user.findUnique({ where: { walletAddress: referrerAddress } }),
      prisma.user.findUnique({ where: { walletAddress: newUserAddress } }),
    ])

    if (!referrer || !newUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For now, we'll just track this in analytics
    // In production, you'd have a Referral model in the schema

    // TODO: Create Referral model and track:
    // - referrerId
    // - referredId
    // - signupDate
    // - firstBetDate
    // - rewardAmount (5% of first bet)
    // - status (pending, completed, paid)

    return NextResponse.json({
      success: true,
      message: 'Referral recorded',
      // In production: reward = 5% of referred user's first bet
      reward: {
        percentage: 5,
        description: 'You will earn 5% of your friend\'s first bet!',
      },
    })
  } catch (error) {
    console.error('Referral recording error:', error)
    return NextResponse.json({ error: 'Failed to record referral' }, { status: 500 })
  }
}
