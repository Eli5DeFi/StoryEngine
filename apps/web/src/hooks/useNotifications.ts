import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import type { NotificationType } from '@voidborne/database'

export interface Notification {
  id: string
  createdAt: string
  type: NotificationType
  title: string
  message: string
  link?: string
  isRead: boolean
  readAt?: string
  metadata?: any
}

export interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  inAppEnabled: boolean
  chapterReleases: boolean
  betOutcomes: boolean
  streaks: boolean
  leaderboard: boolean
  friendActivity: boolean
  weeklyDigest: boolean
  poolClosing: boolean
  system: boolean
}

export function useNotifications() {
  const { address } = useAccount()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      if (!address) return

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          walletAddress: address,
          limit: '50',
          offset: '0',
        })

        if (unreadOnly) {
          params.append('unreadOnly', 'true')
        }

        const res = await fetch(`/api/notifications?${params}`)
        if (!res.ok) throw new Error('Failed to fetch notifications')

        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
        setError('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    },
    [address]
  )

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          isRead: true,
        }),
      })

      if (!res.ok) throw new Error('Failed to mark as read')

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id)
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
    } catch (err) {
      console.error('Failed to mark as read:', err)
      throw err
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id)

    if (unreadIds.length === 0) return

    await markAsRead(unreadIds)
  }, [notifications, markAsRead])

  // Delete notifications
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })

      if (!res.ok) throw new Error('Failed to delete notifications')

      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => !notificationIds.includes(n.id))
      )

      // Update unread count if any deleted notifications were unread
      const deletedUnreadCount = notifications.filter(
        (n) => notificationIds.includes(n.id) && !n.isRead
      ).length

      setUnreadCount((prev) => Math.max(0, prev - deletedUnreadCount))
    } catch (err) {
      console.error('Failed to delete notifications:', err)
      throw err
    }
  }, [notifications])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!address) return

    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [address, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
  }
}

export function useNotificationPreferences() {
  const { address } = useAccount()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/notifications/preferences?walletAddress=${address}`
      )
      if (!res.ok) throw new Error('Failed to fetch preferences')

      const data = await res.json()
      setPreferences(data.preferences)
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }, [address])

  // Update preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      if (!address) return

      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            preferences: newPreferences,
          }),
        })

        if (!res.ok) throw new Error('Failed to update preferences')

        const data = await res.json()
        setPreferences(data.preferences)
      } catch (err) {
        console.error('Failed to update preferences:', err)
        setError('Failed to save preferences')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [address]
  )

  // Fetch on mount
  useEffect(() => {
    if (address) {
      fetchPreferences()
    }
  }, [address, fetchPreferences])

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
  }
}
