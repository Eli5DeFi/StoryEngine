'use client'

/**
 * AuctionCountdown — Live countdown timer for active chapter auctions.
 *
 * Visual states:
 * - > 12h  : calm slate text
 * - 6-12h  : amber pulsing
 * - 1-6h   : orange, faster pulse
 * - < 1h   : red critical, urgent glow
 * - 0      : "Auction Ended"
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle } from 'lucide-react'

interface AuctionCountdownProps {
  endsAt: number   // Unix ms timestamp
  onEnded?: () => void
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

function computeTimeLeft(endsAt: number): TimeLeft {
  const totalMs = Math.max(0, endsAt - Date.now())
  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, totalMs }
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function AuctionCountdown({ endsAt, onEnded, className = '' }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(computeTimeLeft(endsAt))

  useEffect(() => {
    const interval = setInterval(() => {
      const t = computeTimeLeft(endsAt)
      setTimeLeft(t)
      if (t.totalMs === 0) {
        clearInterval(interval)
        onEnded?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [endsAt, onEnded])

  const hoursTotal = timeLeft.days * 24 + timeLeft.hours

  // Urgency thresholds
  const isEnded = timeLeft.totalMs === 0
  const isCritical = !isEnded && hoursTotal < 1
  const isUrgent = !isEnded && hoursTotal < 6
  const isWarning = !isEnded && hoursTotal < 12

  const colorClass = isEnded
    ? 'text-void-500'
    : isCritical
    ? 'text-red-400'
    : isUrgent
    ? 'text-orange-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-void-300'

  const glowStyle = isCritical
    ? { textShadow: '0 0 12px rgba(248,113,113,0.7)' }
    : isUrgent
    ? { textShadow: '0 0 8px rgba(251,146,60,0.5)' }
    : {}

  if (isEnded) {
    return (
      <div className={`flex items-center gap-2 text-void-500 text-sm font-ui ${className}`}>
        <Clock className="w-4 h-4" />
        <span>Auction Ended</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isCritical && (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </motion.div>
      )}
      {!isCritical && <Clock className="w-4 h-4 text-void-400" />}

      <motion.span
        className={`font-mono text-base font-bold tracking-widest ${colorClass}`}
        style={glowStyle}
        animate={isCritical ? { opacity: [1, 0.6, 1] } : {}}
        transition={isCritical ? { repeat: Infinity, duration: 1 } : {}}
      >
        {timeLeft.days > 0 && (
          <span>{timeLeft.days}d </span>
        )}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </motion.span>

      {isCritical && (
        <span className="text-xs text-red-400 font-ui uppercase tracking-wider animate-pulse">
          CLOSING
        </span>
      )}
    </div>
  )
}
