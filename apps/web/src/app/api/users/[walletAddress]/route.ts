import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/users/[walletAddress]
 * Get user by wallet address (or create if not exists)
 */
export async function GET(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        _count: {
          select: {
            bets: true,
            createdStories: true,
          },
        },
      },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: `user_${walletAddress.slice(2, 8)}`,
        },
        include: {
          _count: {
            select: {
              bets: true,
              createdStories: true,
            },
          },
        },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    logger.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[walletAddress]
 * Update user profile
 */
export async function PATCH(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const body = await request.json()
    const { username, bio, avatar } = body

    const user = await prisma.user.update({
      where: { walletAddress: params.walletAddress },
      data: {
        ...(username && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    logger.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
