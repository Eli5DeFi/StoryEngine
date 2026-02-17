'use client'

import { motion } from 'framer-motion'

interface SurvivalMeterProps {
  probability: number // 0-100
  characterName: string
  className?: string
}

export function SurvivalMeter({
  probability,
  characterName,
  className = '',
}: SurvivalMeterProps) {
  // Color gradient based on survival probability
  const getColor = (pct: number) => {
    if (pct >= 80) return { bar: '#4ade80', text: 'text-success' } // Green
    if (pct >= 60) return { bar: '#4ea5d9', text: 'text-drift-teal' } // Teal
    if (pct >= 40) return { bar: '#fbbf24', text: 'text-warning' } // Yellow
    if (pct >= 20) return { bar: '#f97316', text: 'text-orange-400' } // Orange
    return { bar: '#f87171', text: 'text-error' } // Red
  }

  const { bar, text } = getColor(probability)

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-void-400 font-ui">
          Market implied survival
        </span>
        <span className={`text-sm font-bold font-mono ${text}`}>
          {probability.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-void-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${probability}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: bar }}
        />
      </div>
      <p className="text-xs text-void-500 font-ui">
        Market gives{' '}
        <span className={`font-semibold ${text}`}>{characterName}</span>{' '}
        a {probability.toFixed(0)}% chance of survival
      </p>
    </div>
  )
}
