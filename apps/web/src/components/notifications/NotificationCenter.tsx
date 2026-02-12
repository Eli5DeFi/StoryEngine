'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Trophy,
  TrendingUp,
  Users,
  Clock,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  onClose?: () => void
}

const NOTIFICATION_ICONS = {
  CHAPTER_RELEASED: Bell,
  BET_WON: Trophy,
  BET_LOST: TrendingUp,
  STREAK_MILESTONE: Trophy,
  LEADERBOARD: Users,
  FRIEND_ACTIVITY: Users,
  WEEKLY_DIGEST: Clock,
  POOL_CLOSING: Clock,
  SYSTEM: Bell,
}

const NOTIFICATION_COLORS = {
  CHAPTER_RELEASED: 'text-blue-400',
  BET_WON: 'text-green-400',
  BET_LOST: 'text-red-400',
  STREAK_MILESTONE: 'text-gold',
  LEADERBOARD: 'text-purple-400',
  FRIEND_ACTIVITY: 'text-cyan-400',
  WEEKLY_DIGEST: 'text-foreground/50',
  POOL_CLOSING: 'text-orange-400',
  SYSTEM: 'text-foreground/70',
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.isRead : true
  )

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead([notification.id])
    }

    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link)
      onClose?.()
    }
  }

  const handleDelete = async (notificationId: string) => {
    setDeletingIds((prev) => new Set(prev).add(notificationId))
    try {
      await deleteNotifications([notificationId])
    } catch (error) {
      console.error('Failed to delete notification:', error)
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* Filters & Actions */}
      <div className="flex items-center justify-between p-4 border-b border-void-800">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-gold text-void-950'
                : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              filter === 'unread'
                ? 'bg-gold text-void-950'
                : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 px-3 py-1 rounded bg-void-800/50 hover:bg-void-800 text-xs text-foreground/70 transition-colors"
          >
            <Check className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-foreground/50">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification) => {
              const Icon =
                NOTIFICATION_ICONS[notification.type] || Bell
              const color =
                NOTIFICATION_COLORS[notification.type] ||
                'text-foreground/70'
              const isDeleting = deletingIds.has(notification.id)

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className={`relative group border-b border-void-800/50 hover:bg-void-800/30 transition-colors ${
                    !notification.isRead ? 'bg-void-800/20' : ''
                  }`}
                >
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className="flex gap-3 p-4 cursor-pointer"
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400" />
                        )}
                      </div>

                      <p className="text-xs text-foreground/70 line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground/50">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </span>

                        {notification.link && (
                          <ExternalLink className="w-3 h-3 text-foreground/50" />
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      disabled={isDeleting}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-void-800 text-center">
          <button
            onClick={() => {
              router.push('/notifications')
              onClose?.()
            }}
            className="text-sm text-gold hover:text-gold/80 font-medium transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
