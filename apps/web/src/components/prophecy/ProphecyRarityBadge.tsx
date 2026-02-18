'use client'

/**
 * ProphecyRarityBadge
 * Displays rarity tier for a Prophecy NFT with appropriate color + icon.
 *
 * Rarity tiers (from Innovation Cycle #49):
 *   MYTHIC    — Fulfilled + minted #1-5
 *   LEGENDARY — Fulfilled
 *   RARE      — Echoed + minted #1-10
 *   UNCOMMON  — Echoed
 *   COMMON    — Unfulfilled
 *   PENDING   — Chapter not yet resolved
 */

export type Rarity = 'MYTHIC' | 'LEGENDARY' | 'RARE' | 'UNCOMMON' | 'COMMON' | 'PENDING'
export type ProphecyStatus = 'PENDING' | 'FULFILLED' | 'ECHOED' | 'UNFULFILLED'

interface Props {
  rarity?: Rarity
  status?: ProphecyStatus
  mintOrder?: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const RARITY_CONFIG: Record<Rarity, {
  label: string
  icon: string
  bg: string
  text: string
  border: string
  glow: string
}> = {
  MYTHIC: {
    label: 'Mythic',
    icon: '✦',
    bg: 'bg-gradient-to-r from-violet-900/80 to-amber-900/80',
    text: 'text-amber-200',
    border: 'border-amber-400/60',
    glow: 'shadow-amber-500/40',
  },
  LEGENDARY: {
    label: 'Legendary',
    icon: '★',
    bg: 'bg-gradient-to-r from-amber-900/80 to-yellow-900/80',
    text: 'text-amber-300',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-400/30',
  },
  RARE: {
    label: 'Rare',
    icon: '◈',
    bg: 'bg-gradient-to-r from-slate-800/80 to-slate-700/80',
    text: 'text-slate-200',
    border: 'border-slate-400/50',
    glow: 'shadow-slate-400/20',
  },
  UNCOMMON: {
    label: 'Echoed',
    icon: '◇',
    bg: 'bg-slate-800/60',
    text: 'text-slate-300',
    border: 'border-slate-500/40',
    glow: '',
  },
  COMMON: {
    label: 'Void Relic',
    icon: '▪',
    bg: 'bg-void-900/60',
    text: 'text-void-400',
    border: 'border-void-700/40',
    glow: '',
  },
  PENDING: {
    label: 'Sealed',
    icon: '▓',
    bg: 'bg-void-900/40',
    text: 'text-void-500',
    border: 'border-void-700/30',
    glow: '',
  },
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
}

/**
 * Derive rarity from status + mintOrder.
 */
export function deriveRarity(status: ProphecyStatus, mintOrder?: number): Rarity {
  if (status === 'PENDING') return 'PENDING'
  if (status === 'UNFULFILLED') return 'COMMON'
  if (status === 'ECHOED') return (mintOrder ?? 99) <= 10 ? 'RARE' : 'UNCOMMON'
  // FULFILLED
  return (mintOrder ?? 99) <= 5 ? 'MYTHIC' : 'LEGENDARY'
}

export function ProphecyRarityBadge({
  rarity: rarityProp,
  status,
  mintOrder,
  size = 'md',
  showIcon = true,
}: Props) {
  const rarity = rarityProp ?? (status ? deriveRarity(status, mintOrder) : 'PENDING')
  const cfg = RARITY_CONFIG[rarity]

  return (
    <span
      className={[
        'inline-flex items-center rounded-sm border font-mono uppercase tracking-wider',
        cfg.bg,
        cfg.text,
        cfg.border,
        cfg.glow ? `shadow-sm ${cfg.glow}` : '',
        SIZE_CLASSES[size],
      ].join(' ')}
    >
      {showIcon && <span aria-hidden="true">{cfg.icon}</span>}
      {cfg.label}
    </span>
  )
}
