'use client'

/**
 * ProphecyGallery
 * Displays all prophecies for a chapter (or across chapters).
 * Features:
 *   - Filter by status
 *   - Sort by mint count / rarity
 *   - Empty state with "coming soon" when no prophecies exist
 *   - Inline mint via ProphecyMintModal
 */

import { useState, useCallback } from 'react'
import { ProphecyCard, type ProphecyData } from './ProphecyCard'
import { ProphecyMintModal } from './ProphecyMintModal'

type StatusFilter = 'ALL' | 'PENDING' | 'FULFILLED' | 'ECHOED' | 'UNFULFILLED'
type SortKey = 'newest' | 'rarest' | 'most-minted' | 'spots-remaining'

interface Props {
  prophecies: ProphecyData[]
  chapterTitle?: string
  chapterNumber?: number
  storyTitle?: string
  summary?: {
    total: number
    totalMinted: number
    fulfilled: number
    echoed: number
    unfulfilled: number
    pending: number
  }
  onRefresh?: () => void
  isLoading?: boolean
}

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL:         'All',
  PENDING:     'Open',
  FULFILLED:   '★ Fulfilled',
  ECHOED:      '◈ Echoed',
  UNFULFILLED: '▪ Void Relics',
}

export function ProphecyGallery({
  prophecies,
  chapterTitle,
  chapterNumber,
  storyTitle,
  summary,
  onRefresh,
  isLoading = false,
}: Props) {
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [activeMint, setActiveMint] = useState<ProphecyData | null>(null)

  // Filter
  const filtered = prophecies.filter(
    (p) => filter === 'ALL' || p.status === filter
  )

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'rarest':
        // FULFILLED > ECHOED > PENDING > UNFULFILLED
        const rank: Record<string, number> = {
          FULFILLED: 4, ECHOED: 3, PENDING: 2, UNFULFILLED: 1,
        }
        return (rank[b.status] ?? 0) - (rank[a.status] ?? 0)
      case 'most-minted':
        return b.mintedCount - a.mintedCount
      case 'spots-remaining':
        return a.spotsRemaining - b.spotsRemaining
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const handleMintSuccess = useCallback(
    (mintOrder: number) => {
      console.log(`Minted at position #${mintOrder}`)
      setActiveMint(null)
      onRefresh?.()
    },
    [onRefresh]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      {(chapterTitle || summary) && (
        <div className="space-y-3">
          {chapterTitle && (
            <div>
              <p className="text-[11px] font-mono text-void-500 uppercase tracking-widest mb-1">
                {storyTitle ?? 'Voidborne'} • Chapter {chapterNumber}
              </p>
              <h2
                className="text-xl text-void-100"
                style={{ fontFamily: 'var(--font-cinzel)' }}
              >
                {chapterTitle} — Prophecies
              </h2>
            </div>
          )}

          {/* Summary stats */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Prophecies', value: summary.total, color: 'text-void-300' },
                { label: 'Total Minted', value: summary.totalMinted, color: 'text-void-300' },
                { label: '★ Fulfilled', value: summary.fulfilled, color: 'text-amber-400' },
                { label: '◈ Echoed', value: summary.echoed, color: 'text-slate-300' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded border border-void-800/30 bg-void-950/40 p-3"
                >
                  <div className={`text-xl font-bold font-mono ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-void-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((s) => {
            const count = s === 'ALL'
              ? prophecies.length
              : prophecies.filter((p) => p.status === s).length
            if (count === 0 && s !== 'ALL') return null
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={[
                  'px-3 py-1 rounded text-xs font-mono border transition-all duration-200',
                  filter === s
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                    : 'border-void-700/30 bg-void-900/40 text-void-400 hover:border-void-600/50',
                ].join(' ')}
              >
                {FILTER_LABELS[s]}
                <span className="ml-1 text-void-600">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="ml-auto">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-xs font-mono bg-void-900 border border-void-700/30 text-void-400 rounded px-2 py-1 focus:outline-none focus:border-void-600"
          >
            <option value="newest">Newest first</option>
            <option value="rarest">Rarest first</option>
            <option value="most-minted">Most minted</option>
            <option value="spots-remaining">Fewest spots</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg border border-void-800/30 bg-void-950/40 animate-pulse"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState filter={filter} totalProphecies={prophecies.length} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((prophecy) => (
            <ProphecyCard
              key={prophecy.id}
              prophecy={prophecy}
              onMint={(id) => {
                const p = prophecies.find((x) => x.id === id)
                if (p) setActiveMint(p)
              }}
            />
          ))}
        </div>
      )}

      {/* Oracle Pack hint */}
      {prophecies.filter((p) => p.status === 'PENDING' && p.spotsRemaining > 0 && !p.userMint).length >= 3 && (
        <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-xs font-mono text-amber-400/70 text-center">
          ⊕ Oracle Pack available — mint 3+ prophecies at once for a 10% discount
        </div>
      )}

      {/* Mint Modal */}
      {activeMint && (
        <ProphecyMintModal
          prophecy={activeMint}
          isOpen={!!activeMint}
          onClose={() => setActiveMint(null)}
          onMintSuccess={handleMintSuccess}
          relatedProphecies={prophecies.filter(
            (p) => p.id !== activeMint.id && p.status === 'PENDING' && p.spotsRemaining > 0 && !p.userMint
          )}
        />
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter, totalProphecies }: { filter: StatusFilter; totalProphecies: number }) {
  if (totalProphecies === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl text-void-700">▓</div>
        <p
          className="text-void-500"
          style={{ fontFamily: 'var(--font-cinzel)' }}
        >
          The Seers Have Not Yet Spoken
        </p>
        <p className="text-xs text-void-600 font-mono">
          Prophecies will appear here before the next chapter begins.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-12 space-y-2">
      <p className="text-void-500 font-mono text-sm">
        No {FILTER_LABELS[filter].toLowerCase()} prophecies found
      </p>
      <p className="text-void-600 text-xs font-mono">
        Try a different filter above
      </p>
    </div>
  )
}
