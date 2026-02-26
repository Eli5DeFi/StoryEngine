'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, AlertTriangle } from 'lucide-react'

interface PoolClosingTimerProps {
  closesAt: Date | string
  style?: 'calm' | 'moderate' | 'high' | 'critical' | 'auto'
  showIcon?: boolean
  compact?: boolean
  className?: string
  onUrgencyChange?: (level: 'calm' | 'moderate' | 'high' | 'critical') => void
}

export function PoolClosingTimer({
  closesAt,
  style = 'auto',
  showIcon = true,
  compact = false,
  className = '',
  onUrgencyChange
}: PoolClosingTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [urgencyLevel, setUrgencyLevel] = useState<'calm' | 'moderate' | 'high' | 'critical'>('calm')

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const closingTime = new Date(closesAt).getTime()
      const remaining = Math.max(0, closingTime - now)
      
      setTimeRemaining(remaining)

      // Auto-calculate urgency level
      const hoursRemaining = remaining / (1000 * 60 * 60)
      let newLevel: 'calm' | 'moderate' | 'high' | 'critical'
      
      if (hoursRemaining > 24) newLevel = 'calm'
      else if (hoursRemaining > 12) newLevel = 'moderate'
      else if (hoursRemaining > 1) newLevel = 'high'
      else newLevel = 'critical'

      if (newLevel !== urgencyLevel) {
        setUrgencyLevel(newLevel)
        onUrgencyChange?.(newLevel)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [closesAt, urgencyLevel, onUrgencyChange])

  // Format time remaining
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return {
        primary: days,
        primaryLabel: 'day' + (days !== 1 ? 's' : ''),
        secondary: hours % 24,
        secondaryLabel: 'hr' + (hours % 24 !== 1 ? 's' : '')
      }
    } else if (hours > 0) {
      return {
        primary: hours,
        primaryLabel: 'hour' + (hours !== 1 ? 's' : ''),
        secondary: minutes % 60,
        secondaryLabel: 'min'
      }
    } else if (minutes > 0) {
      return {
        primary: minutes,
        primaryLabel: 'min',
        secondary: seconds % 60,
        secondaryLabel: 'sec'
      }
    } else {
      return {
        primary: seconds,
        primaryLabel: 'sec',
        secondary: null,
        secondaryLabel: null
      }
    }
  }

  const time = formatTime(timeRemaining)
  const currentStyle = style === 'auto' ? urgencyLevel : style

  // Style configurations
  const styles = {
    calm: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
      pulse: false,
      pulseSpeed: 2, // Not used, but needed for type consistency
      icon: Clock
    },
    moderate: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
      pulse: true,
      pulseSpeed: 3,
      icon: Clock
    },
    high: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/30',
      pulse: true,
      pulseSpeed: 2,
      icon: AlertTriangle
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/40',
      text: 'text-red-400',
      glow: 'shadow-red-500/50',
      pulse: true,
      pulseSpeed: 1,
      icon: AlertTriangle
    }
  }

  const config = styles[currentStyle]
  const Icon = config.icon

  if (timeRemaining === 0) {
    return (
      <div className={`p-3 rounded-lg bg-red-500/20 border border-red-500/50 ${className}`}>
        <p className="text-sm font-bold text-red-400 text-center">
          🔒 Pool Closed
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <motion.div
        animate={
          config.pulse
            ? {
                scale: [1, 1.02, 1],
                opacity: [1, 0.8, 1]
              }
            : {}
        }
        transition={
          config.pulse
            ? {
                duration: ('pulseSpeed' in config) ? config.pulseSpeed : 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }
            : {}
        }
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.border} border ${className}`}
      >
        {showIcon && <Icon className={`w-4 h-4 ${config.text}`} />}
        <span className={`text-sm font-bold font-mono ${config.text}`}>
          {time.primary}{time.primaryLabel[0]}
          {time.secondary !== null && ` ${time.secondary}${time.secondaryLabel?.[0]}`}
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div
      animate={
        config.pulse
          ? {
              scale: [1, 1.01, 1],
              boxShadow: [
                `0 0 0 0 ${config.glow}`,
                `0 0 20px 4px ${config.glow}`,
                `0 0 0 0 ${config.glow}`
              ]
            }
          : {}
      }
      transition={
        config.pulse
          ? {
              duration: ('pulseSpeed' in config) ? config.pulseSpeed : 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          : {}
      }
      className={`p-4 rounded-lg ${config.bg} ${config.border} border-2 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.text}`} />
          <span className="text-sm font-medium text-foreground/70">
            Pool Closes In
          </span>
        </div>
        {currentStyle === 'critical' && (
          <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse">
            URGENT
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-3">
        {/* Primary time unit */}
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold font-mono ${config.text}`}>
            {time.primary.toString().padStart(2, '0')}
          </span>
          <span className={`text-lg font-medium ${config.text} opacity-70`}>
            {time.primaryLabel}
          </span>
        </div>

        {/* Secondary time unit */}
        {time.secondary !== null && (
          <>
            <span className={`text-2xl font-bold ${config.text} opacity-50`}>:</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold font-mono ${config.text} opacity-80`}>
                {time.secondary.toString().padStart(2, '0')}
              </span>
              <span className={`text-sm font-medium ${config.text} opacity-60`}>
                {time.secondaryLabel}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Urgency message */}
      {currentStyle === 'critical' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs font-medium text-red-400 bg-red-500/10 rounded px-2 py-1"
        >
          ⚡ Last chance to place your bet!
        </motion.p>
      )}
      {currentStyle === 'high' && (
        <p className="mt-3 text-xs text-foreground/60">
          Pool closing soon - odds may shift rapidly
        </p>
      )}
    </motion.div>
  )
}
