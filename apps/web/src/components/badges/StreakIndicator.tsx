'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

type StreakIndicatorProps = {
  currentStreak: number
  longestStreak?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  size = 'md',
  showLabel = true,
}: StreakIndicatorProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (currentStreak === 0) {
    return null
  }

  const isHot = currentStreak >= 3
  const isOnFire = currentStreak >= 7
  const isLegendary = currentStreak >= 15

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${
          isLegendary
            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
            : isOnFire
            ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30'
            : isHot
            ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30'
            : 'bg-gold/10 border border-gold/20'
        }
      `}
    >
      <motion.div
        animate={isHot ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Flame
          className={`${iconSizes[size]} ${
            isLegendary
              ? 'text-yellow-400'
              : isOnFire
              ? 'text-orange-400'
              : isHot
              ? 'text-red-400'
              : 'text-gold'
          }`}
        />
      </motion.div>

      <div className={`font-bold ${sizeClasses[size]}`}>
        {currentStreak}
        {showLabel && <span className="text-foreground/70 font-normal ml-1">streak</span>}
      </div>

      {longestStreak && longestStreak > currentStreak && (
        <div className="text-xs text-foreground/50">
          (best: {longestStreak})
        </div>
      )}
    </motion.div>
  )
}
