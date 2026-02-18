import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/notifications/preferences
 * Get notification preferences for a user
 * 
 * Query params:
 * - walletAddress: string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: { notificationPreference: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If preferences don't exist, create default preferences
    if (!user.notificationPreference) {
      const preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          // All defaults are defined in schema
        },
      })

      return NextResponse.json({ preferences })
    }

    return NextResponse.json({ preferences: user.notificationPreference })
  } catch (error) {
    logger.error('Failed to fetch notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 * 
 * Body:
 * - walletAddress: string (required)
 * - preferences: NotificationPreference (required)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, preferences } = body

    if (!walletAddress || !preferences) {
      return NextResponse.json(
        { error: 'walletAddress and preferences are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Upsert preferences
    const updatedPreferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: preferences,
      create: {
        userId: user.id,
        ...preferences,
      },
    })

    return NextResponse.json({ preferences: updatedPreferences })
  } catch (error) {
    logger.error('Failed to update notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
