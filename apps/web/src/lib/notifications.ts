import { prisma } from '@voidborne/database'
import type { NotificationType } from '@voidborne/database'

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
  return prisma.notification.create({
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
