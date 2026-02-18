'use client'

/**
 * PersonalityBars — Animated horizontal bars for the 5-dimension personality matrix.
 *
 * Dimensions:
 *   - Risk Tolerance: low = conservative, high = degen
 *   - Contrarianism: low = follows crowd, high = always bets against
 *   - Survival Bias: low = pure EV, high = House survival over profit
 *   - Memory Depth: low = ignores history, high = pattern machine
 *   - Bluff Propensity: low = honest bets, high = strategic misdirection
 */

import { motion } from 'framer-motion'

interface PersonalityMatrix {
  riskTolerance: number   // 0-100
  contrarianism: number   // 0-100
  survivalBias: number    // 0-100
  memoryDepth: number     // 0-100
  bluffPropensity: number // 0-100
}

interface PersonalityBarsProps {
  personality: PersonalityMatrix
  accentHex: string
}

const DIMENSIONS: Array<{
  key: keyof PersonalityMatrix
  label: string
  lowLabel: string
  highLabel: string
}> = [
  { key: 'riskTolerance',   label: 'Risk',     lowLabel: 'Cautious',  highLabel: 'Degen'     },
  { key: 'contrarianism',   label: 'Crowd',    lowLabel: 'Follower',  highLabel: 'Contrarian' },
  { key: 'survivalBias',    label: 'Loyalty',  lowLabel: 'Pure EV',   highLabel: 'House First' },
  { key: 'memoryDepth',     label: 'Memory',   lowLabel: 'Forgets',   highLabel: 'Pattern Pro' },
  { key: 'bluffPropensity', label: 'Bluff',    lowLabel: 'Honest',    highLabel: 'Deceiver'  },
]

export function PersonalityBars({ personality, accentHex }: PersonalityBarsProps) {
  return (
    <div className="space-y-2.5">
      {DIMENSIONS.map((dim, i) => {
        const value = personality[dim.key]
        return (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-ui text-void-400 uppercase tracking-wider">
                {dim.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-void-600">{dim.lowLabel}</span>
                <span className="text-xs font-bold text-void-300">{value}</span>
                <span className="text-xs text-void-600">{dim.highLabel}</span>
              </div>
            </div>
            <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accentHex}80, ${accentHex})`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
