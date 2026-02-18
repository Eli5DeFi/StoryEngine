'use client'

/**
 * ProphecyCard
 * Displays a single Prophecy NFT with:
 *  - Dynamic art based on fulfillment status (PENDING → dark, FULFILLED → golden, ECHOED → silver)
 *  - Animated transformation on status change
 *  - Mint order prestige indicator
 *  - Mint button (calls onMint prop)
 *
 * Design: "Ruins of the Future" — dark void base, gold/silver accents
 */

import { useState } from 'react'
import { ProphecyRarityBadge, deriveRarity, type ProphecyStatus } from './ProphecyRarityBadge'

export interface ProphecyData {
  id: string
  teaser: string
  text: string | null
  status: ProphecyStatus
  artTheme: string | null
  pendingURI: string
  fulfilledURI: string | null
  echoedURI: string | null
  unfulfilledURI: string | null
  mintedCount: number
  maxSupply: number
  spotsRemaining: number
  createdAt: string
  fulfilledAt: string | null
  chapter: {
    id: string
    chapterNumber: number
    title: string
    story: { id: string; title: string }
  }
  // If the connected user has minted this
  userMint?: {
    mintOrder: number
    forgePaid: number
  }
}

interface Props {
  prophecy: ProphecyData
  onMint?: (prophecyId: string) => void
  loading?: boolean
  compact?: boolean
}

// ─── Art Themes ───────────────────────────────────────────────────────────────

const THEME_GRADIENTS: Record<string, string> = {
  void:   'from-void-950 via-[#0a0a1a] to-void-900',
  light:  'from-void-950 via-[#1a1520] to-amber-950',
  shadow: 'from-void-950 via-[#0f0a0f] to-violet-950',
  fire:   'from-void-950 via-[#1a0a00] to-red-950',
  ice:    'from-void-950 via-[#0a0f1a] to-cyan-950',
  cosmic: 'from-void-950 via-[#080c1a] to-indigo-950',
}

const STATUS_OVERLAYS: Record<ProphecyStatus, string> = {
  PENDING:     'opacity-0',
  UNFULFILLED: 'opacity-0',
  ECHOED:      'bg-gradient-to-t from-slate-400/10 to-transparent opacity-100',
  FULFILLED:   'bg-gradient-to-t from-amber-400/20 to-transparent opacity-100',
}

const STATUS_BORDER: Record<ProphecyStatus, string> = {
  PENDING:     'border-void-700/40 hover:border-void-600/60',
  UNFULFILLED: 'border-void-800/30',
  ECHOED:      'border-slate-500/50 hover:border-slate-400/70',
  FULFILLED:   'border-amber-500/60 hover:border-amber-400/80',
}

const STATUS_GLOW: Record<ProphecyStatus, string> = {
  PENDING:     '',
  UNFULFILLED: '',
  ECHOED:      'shadow-[0_0_20px_rgba(148,163,184,0.08)]',
  FULFILLED:   'shadow-[0_0_30px_rgba(212,168,83,0.15)]',
}

// ─── Particle Symbols ──────────────────────────────────────────────────────────
const VOID_SYMBOLS = ['⌬', '⊕', '⌖', '⋈', '◈', '⌘', '✦', '⊗', '⌭', '⋄']

function getSymbol(index: number) {
  return VOID_SYMBOLS[index % VOID_SYMBOLS.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProphecyCard({ prophecy, onMint, loading = false, compact = false }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const [mintPending, setMintPending] = useState(false)

  const rarity = deriveRarity(prophecy.status, prophecy.userMint?.mintOrder)
  const isSoldOut = prophecy.spotsRemaining <= 0
  const canMint = prophecy.status === 'PENDING' && !isSoldOut && !prophecy.userMint
  const theme = prophecy.artTheme ?? 'void'
  const gradient = THEME_GRADIENTS[theme] ?? THEME_GRADIENTS.void

  const handleMint = async () => {
    if (!canMint || !onMint) return
    setMintPending(true)
    try {
      await onMint(prophecy.id)
    } finally {
      setMintPending(false)
    }
  }

  return (
    <div
      className={[
        'relative group rounded-lg border overflow-hidden cursor-default',
        'transition-all duration-500',
        STATUS_BORDER[prophecy.status],
        STATUS_GLOW[prophecy.status],
        compact ? 'p-4' : 'p-5',
      ].join(' ')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-700`} />

      {/* Status-based overlay glow */}
      <div className={`absolute inset-0 transition-all duration-700 ${STATUS_OVERLAYS[prophecy.status]}`} />

      {/* Animated particles (FULFILLED / ECHOED only) */}
      {(prophecy.status === 'FULFILLED' || prophecy.status === 'ECHOED') && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={[
                'absolute text-[10px] font-mono transition-all duration-1000',
                prophecy.status === 'FULFILLED' ? 'text-amber-400/30' : 'text-slate-400/20',
                isHovered ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              {getSymbol(i)}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ProphecyRarityBadge rarity={rarity} size="sm" />
              {prophecy.userMint && (
                <span className="text-[10px] font-mono text-void-400 uppercase tracking-wider">
                  #{prophecy.userMint.mintOrder} of {prophecy.maxSupply}
                </span>
              )}
            </div>
            <p className="text-[11px] text-void-500 font-mono">
              Ch.{prophecy.chapter.chapterNumber} — {prophecy.chapter.story.title}
            </p>
          </div>

          {/* Mint counter */}
          <div className="text-right">
            <div className="text-[11px] font-mono text-void-400">
              {prophecy.mintedCount}/{prophecy.maxSupply}
            </div>
            {prophecy.spotsRemaining > 0 && prophecy.status === 'PENDING' && (
              <div className="text-[10px] text-void-500">
                {prophecy.spotsRemaining} left
              </div>
            )}
          </div>
        </div>

        {/* Prophecy text / teaser */}
        <div className="mb-4">
          {prophecy.text ? (
            /* Revealed text */
            <p
              className={[
                'text-sm leading-relaxed italic',
                prophecy.status === 'FULFILLED' ? 'text-amber-100' :
                  prophecy.status === 'ECHOED' ? 'text-slate-200' : 'text-void-300',
              ].join(' ')}
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              &ldquo;{prophecy.text}&rdquo;
            </p>
          ) : (
            /* Sealed teaser */
            <div className="space-y-1">
              <p
                className="text-sm text-void-400 italic"
                style={{ fontFamily: 'var(--font-cinzel)' }}
              >
                &ldquo;{prophecy.teaser}&rdquo;
              </p>
              <p className="text-[11px] text-void-600 font-mono">
                ▓▓▓ sealed until chapter resolves ▓▓▓
              </p>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {prophecy.status !== 'PENDING' && (
          <div className={[
            'flex items-center gap-1.5 text-xs font-mono mb-4 px-2 py-1 rounded',
            prophecy.status === 'FULFILLED'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              : prophecy.status === 'ECHOED'
              ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
              : 'bg-void-800/40 text-void-500 border border-void-700/20',
          ].join(' ')}>
            <span>
              {prophecy.status === 'FULFILLED' ? '★ FULFILLED' :
                prophecy.status === 'ECHOED' ? '◈ ECHOED' : '▪ VOID RELIC'}
            </span>
            {prophecy.fulfilledAt && (
              <span className="text-void-600 ml-auto">
                {new Date(prophecy.fulfilledAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Mint supply bar */}
        {prophecy.status === 'PENDING' && (
          <div className="mb-4">
            <div className="h-0.5 bg-void-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-void-600 to-void-500 transition-all duration-500"
                style={{ width: `${(prophecy.mintedCount / prophecy.maxSupply) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Mint button / status */}
        {prophecy.userMint ? (
          <div className="flex items-center gap-2 text-xs font-mono text-void-400">
            <span className="text-amber-400">✓</span>
            <span>Minted — Mint #{prophecy.userMint.mintOrder}</span>
            <span className="ml-auto text-void-500">{prophecy.userMint.forgePaid} $FORGE</span>
          </div>
        ) : canMint ? (
          <button
            onClick={handleMint}
            disabled={mintPending || loading}
            className={[
              'w-full py-2 px-4 rounded text-xs font-mono uppercase tracking-widest',
              'border transition-all duration-300',
              'bg-void-900 border-void-600 text-void-300',
              'hover:bg-void-800 hover:border-amber-500/50 hover:text-amber-300',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              mintPending ? 'animate-pulse' : '',
            ].join(' ')}
          >
            {mintPending ? 'Minting...' : 'Mint Prophecy — 5 $FORGE'}
          </button>
        ) : isSoldOut ? (
          <div className="text-center text-[11px] font-mono text-void-600 uppercase tracking-wider">
            Sold Out
          </div>
        ) : prophecy.status !== 'PENDING' ? (
          <div className="text-center text-[11px] font-mono text-void-600 uppercase tracking-wider">
            Chapter Resolved
          </div>
        ) : null}
      </div>
    </div>
  )
}
