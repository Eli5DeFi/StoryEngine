import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import type { NotificationType } from '@voidborne/database'

/**
 * POST /api/notifications/send
 * Send a notification to one or more users
 * 
 * Body:
 * - walletAddresses?: string[] (optional, send to specific users)
 * - userIds?: string[] (optional, send to specific user IDs)
 * - broadcastType?: 'all' | 'active' | 'betting' (optional, broadcast to groups)
 * - type: NotificationType (required)
 * - title: string (required)
 * - message: string (required)
 * - link?: string (optional)
 * - metadata?: object (optional)
 * - respectPreferences?: boolean (optional, default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      walletAddresses,
      userIds,
      broadcastType,
      type,
      title,
      message,
      link,
      metadata,
      respectPreferences = true,
    } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'type, title, and message are required' },
        { status: 400 }
      )
    }

    let targetUserIds: string[] = []

    // Determine target users
    if (userIds && userIds.length > 0) {
      targetUserIds = userIds
    } else if (walletAddresses && walletAddresses.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          walletAddress: {
            in: walletAddresses.map((addr: string) => addr.toLowerCase()),
          },
        },
        select: { id: true },
      })
      targetUserIds = users.map((u) => u.id)
    } else if (broadcastType) {
      // Broadcast to groups
      let query: any = {}

      switch (broadcastType) {
        case 'all':
          // All users
          query = {}
          break
        case 'active':
          // Users who bet in the last 7 days
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          query = {
            lastBetDate: {
              gte: sevenDaysAgo,
            },
          }
          break
        case 'betting':
          // Users with at least one bet
          query = {
            totalBets: {
              gt: 0,
            },
          }
          break
        default:
          return NextResponse.json(
            { error: 'Invalid broadcastType' },
            { status: 400 }
          )
      }

      const users = await prisma.user.findMany({
        where: query,
        select: { id: true },
      })
      targetUserIds = users.map((u) => u.id)
    } else {
      return NextResponse.json(
        { error: 'Must specify walletAddresses, userIds, or broadcastType' },
        { status: 400 }
      )
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No target users found' },
        { status: 400 }
      )
    }

    // If respecting preferences, filter users based on their settings
    let filteredUserIds = targetUserIds
    if (respectPreferences) {
      const preferences = await prisma.notificationPreference.findMany({
        where: {
          userId: { in: targetUserIds },
        },
      })

      // Filter based on notification type
      filteredUserIds = targetUserIds.filter((userId) => {
        const userPref = preferences.find((p) => p.userId === userId)
        if (!userPref) return true // No preferences = enabled by default

        // Check if this notification type is enabled
        switch (type) {
          case 'CHAPTER_RELEASED':
            return userPref.chapterReleases
          case 'BET_WON':
          case 'BET_LOST':
            return userPref.betOutcomes
          case 'STREAK_MILESTONE':
            return userPref.streaks
          case 'LEADERBOARD':
            return userPref.leaderboard
          case 'FRIEND_ACTIVITY':
            return userPref.friendActivity
          case 'WEEKLY_DIGEST':
            return userPref.weeklyDigest
          case 'POOL_CLOSING':
            return userPref.poolClosing
          case 'SYSTEM':
            return userPref.system
          default:
            return true
        }
      })
    }

    if (filteredUserIds.length === 0) {
      return NextResponse.json(
        { message: 'All users have disabled this notification type' },
        { status: 200 }
      )
    }

    // Create notifications for all target users
    const notifications = await prisma.notification.createMany({
      data: filteredUserIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        link,
        metadata,
      })),
    })

    return NextResponse.json({
      sent: notifications.count,
      filtered: targetUserIds.length - filteredUserIds.length,
      total: targetUserIds.length,
    })
  } catch (error) {
    console.error('Failed to send notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to send a notification (can be imported elsewhere)
 */
export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
}) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      metadata,
    },
  })
}

/**
 * Helper function to send notifications to multiple users
 */
export async function sendBulkNotifications({
  userIds,
  type,
  title,
  message,
  link,
  metadata,
  respectPreferences = true,
}: {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
  respectPreferences?: boolean
}) {
  let filteredUserIds = userIds

  if (respectPreferences) {
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } },
    })

    filteredUserIds = userIds.filter((userId) => {
      const userPref = preferences.find((p) => p.userId === userId)
      if (!userPref) return true

      switch (type) {
        case 'CHAPTER_RELEASED':
          return userPref.chapterReleases
        case 'BET_WON':
        case 'BET_LOST':
          return userPref.betOutcomes
        case 'STREAK_MILESTONE':
          return userPref.streaks
        case 'LEADERBOARD':
          return userPref.leaderboard
        case 'FRIEND_ACTIVITY':
          return userPref.friendActivity
        case 'WEEKLY_DIGEST':
          return userPref.weeklyDigest
        case 'POOL_CLOSING':
          return userPref.poolClosing
        case 'SYSTEM':
          return userPref.system
        default:
          return true
      }
    })
  }

  if (filteredUserIds.length === 0) {
    return { sent: 0, filtered: userIds.length }
  }

  const result = await prisma.notification.createMany({
    data: filteredUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link,
      metadata,
    })),
  })

  return {
    sent: result.count,
    filtered: userIds.length - filteredUserIds.length,
  }
}
