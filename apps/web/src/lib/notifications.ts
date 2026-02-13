import { prisma } from '@voidborne/database'
import type { NotificationType } from '@voidborne/database'

export async function sendBulkNotifications({
  walletAddresses,
  userIds,
  broadcastType,
  type,
  title,
  message,
  link,
  metadata,
  respectPreferences = true,
}: {
  walletAddresses?: string[]
  userIds?: string[]
  broadcastType?: 'all' | 'active' | 'betting'
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
  respectPreferences?: boolean
}) {
  // Collect target user IDs
  let targetUserIds: string[] = []

  if (userIds) {
    targetUserIds = userIds
  } else if (walletAddresses) {
    const users = await prisma.user.findMany({
      where: {
        walletAddress: { in: walletAddresses },
      },
      select: { id: true },
    })
    targetUserIds = users.map((u) => u.id)
  } else if (broadcastType) {
    const where: any = {}
    if (broadcastType === 'active') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      where.lastActiveAt = { gte: sevenDaysAgo }
    } else if (broadcastType === 'betting') {
      where.bets = { some: {} }
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    })
    targetUserIds = users.map((u) => u.id)
  }

  if (targetUserIds.length === 0) {
    return { sent: 0, filtered: 0 }
  }

  // Filter by preferences if requested
  let filteredUserIds = targetUserIds
  if (respectPreferences) {
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: targetUserIds },
      },
    })

    const disabledUsers = new Set(
      preferences
        .filter((pref) => {
          const typeField = `${type.toLowerCase()}Enabled` as keyof typeof pref
          return pref[typeField] === false
        })
        .map((pref) => pref.userId)
    )

    filteredUserIds = targetUserIds.filter((id) => !disabledUsers.has(id))
  }

  // Create notifications
  const notifications = await prisma.notification.createMany({
    data: filteredUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    })),
  })

  return {
    sent: notifications.count,
    filtered: targetUserIds.length - filteredUserIds.length,
  }
}
