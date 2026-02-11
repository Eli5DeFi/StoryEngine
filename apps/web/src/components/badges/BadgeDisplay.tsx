'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

type Badge = {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  earnedAt?: Date
}

type BadgeDisplayProps = {
  badges: Badge[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const rarityColors = {
  COMMON: 'from-gray-400 to-gray-600',
  RARE: 'from-blue-400 to-blue-600',
  EPIC: 'from-purple-400 to-purple-600',
  LEGENDARY: 'from-yellow-400 to-yellow-600',
}

const sizeClasses = {
  sm: 'text-lg p-1.5',
  md: 'text-2xl p-2',
  lg: 'text-4xl p-3',
}

export function BadgeDisplay({
  badges,
  maxDisplay = 5,
  size = 'md',
  showTooltip = true,
}: BadgeDisplayProps) {
  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = Math.max(0, badges.length - maxDisplay)

  if (badges.length === 0) {
    return (
      <div className="text-foreground/40 text-sm italic">
        No badges earned yet
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayBadges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative group"
        >
          <div
            className={`
              ${sizeClasses[size]}
              rounded-lg
              bg-gradient-to-br ${rarityColors[badge.rarity]}
              backdrop-blur
              border border-white/20
              shadow-lg
              cursor-pointer
              transition-all
              hover:scale-110
              hover:shadow-xl
            `}
            title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
          >
            {badge.icon}
          </div>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-void-950 border border-gold/20 rounded-lg px-3 py-2 text-sm whitespace-nowrap shadow-xl">
                <div className="font-bold text-gold">{badge.name}</div>
                <div className="text-foreground/70 text-xs">{badge.description}</div>
                {badge.earnedAt && (
                  <div className="text-foreground/40 text-xs mt-1">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rarity indicator */}
          {badge.rarity === 'LEGENDARY' && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </motion.div>
          )}
        </motion.div>
      ))}

      {remainingCount > 0 && (
        <div className={`${sizeClasses[size]} text-foreground/50 font-medium`}>
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
