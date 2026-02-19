'use client'

/**
 * ChaosOracleBanner
 * Innovation Cycle #53 — "The Living Story Protocol"
 *
 * A compact top-of-chapter banner showing the dominant chaos signal.
 * Creates the viral "BTC crashed → Valdris is in trouble" moment.
 *
 * Usage: Place above the ChapterReader inside the story page.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, TrendingUp, Zap, Waves, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface SignalData {
  chaosIntensity: 'calm' | 'tense' | 'volatile' | 'maelstrom'
  dominantEffect: string
  dominantHouseBeneficiary: string
  dominantHouseBurdened: string
  chapterMoodOverride: string
  signals: Array<{
    metric: string
    valueFormatted: string
    direction: 'spike' | 'crash' | 'surge' | 'neutral' | 'volatile'
    intensity: number
    metricLabel: string
  }>
}

const HOUSE_TEXT: Record<string, string> = {
  valdris: 'text-amber-400',
  obsidian: 'text-purple-400',
  aurelius: 'text-cyan-400',
  strand: 'text-emerald-400',
  null: 'text-gray-400',
  none: 'text-white/40',
}

const INTENSITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  calm:      { bg: 'bg-emerald-950/50',  border: 'border-emerald-900/50', icon: 'text-emerald-400' },
  tense:     { bg: 'bg-amber-950/50',    border: 'border-amber-900/50',   icon: 'text-amber-400'   },
  volatile:  { bg: 'bg-orange-950/50',   border: 'border-orange-900/50',  icon: 'text-orange-400'  },
  maelstrom: { bg: 'bg-red-950/50',      border: 'border-red-900/50',     icon: 'text-red-400'     },
}

function DirectionIcon({ direction }: { direction: string }) {
  const cls = 'w-3.5 h-3.5'
  switch (direction) {
    case 'crash':    return <TrendingDown className={`${cls} text-red-400`} />
    case 'surge':    return <TrendingUp className={`${cls} text-emerald-400`} />
    case 'spike':    return <Zap className={`${cls} text-amber-400`} />
    case 'volatile': return <Waves className={`${cls} text-orange-400`} />
    default:         return null
  }
}

interface ChaosOracleBannerProps {
  chapterNumber?: number
  /** Story detail page URL for the "See signals" link */
  storyId?: string
  className?: string
}

export function ChaosOracleBanner({ chapterNumber, storyId, className = '' }: ChaosOracleBannerProps) {
  const [data, setData] = useState<SignalData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user dismissed this session
    const key = 'chaos-oracle-dismissed'
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) {
      setDismissed(true)
      setLoading(false)
      return
    }

    fetch('/api/chaos-oracle/signals')
      .then(r => r.json())
      .then((json: SignalData) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function dismiss() {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chaos-oracle-dismissed', '1')
    }
  }

  if (loading || dismissed || !data) return null

  // Only show for tense+ intensity or if dominant signal is not neutral
  const topSignal = data.signals?.[0]
  if (data.chaosIntensity === 'calm' && !topSignal) return null
  if (topSignal?.direction === 'neutral') return null

  const style = INTENSITY_STYLES[data.chaosIntensity] ?? INTENSITY_STYLES.tense

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scaleY: 0.8 }}
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        exit={{ opacity: 0, y: -12, scaleY: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg border ${style.bg} ${style.border} px-3 py-2.5 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {/* Pulse indicator */}
          <div className="relative flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${style.icon.replace('text-', 'bg-')} animate-pulse`} />
          </div>

          {/* Signal info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                Chaos Oracle
                {chapterNumber ? ` · Ch.${chapterNumber}` : ''}
              </span>
              <span className="text-white/20">·</span>

              {/* Top signal value */}
              {topSignal && (
                <>
                  <DirectionIcon direction={topSignal.direction} />
                  <span className={`text-xs font-mono font-semibold ${
                    topSignal.direction === 'crash' ? 'text-red-400' :
                    topSignal.direction === 'surge' || topSignal.direction === 'spike' ? 'text-emerald-400' :
                    'text-orange-400'
                  }`}>
                    {topSignal.metricLabel} {topSignal.valueFormatted}
                  </span>
                  <span className="text-white/20">→</span>
                </>
              )}

              {/* Narrative effect */}
              <span className="text-xs text-white/70 truncate">
                {data.dominantEffect}
              </span>
            </div>

            {/* House impact line */}
            <p className="text-[10px] text-white/30 mt-0.5">
              Favours{' '}
              <span className={`font-semibold capitalize ${HOUSE_TEXT[data.dominantHouseBeneficiary] ?? 'text-white/50'}`}>
                House {data.dominantHouseBeneficiary}
              </span>
              {data.dominantHouseBurdened && data.dominantHouseBurdened !== 'none' && (
                <>
                  {' '}· Burdens{' '}
                  <span className={`font-semibold capitalize ${HOUSE_TEXT[data.dominantHouseBurdened] ?? 'text-white/50'}`}>
                    House {data.dominantHouseBurdened}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {storyId && (
              <Link
                href={`/story/${storyId}#chaos-oracle`}
                className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-0.5"
              >
                Details <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={dismiss}
              className="text-white/20 hover:text-white/50 transition-colors ml-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
