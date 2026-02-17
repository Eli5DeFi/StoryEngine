'use client'

import type { RiskTier } from '@/types/insurance'

interface RiskBadgeProps {
  tier: RiskTier
  className?: string
}

const TIER_CONFIG: Record<
  RiskTier,
  { label: string; className: string; dot: string }
> = {
  LOW: {
    label: 'Low Risk',
    className: 'bg-success/15 text-success border border-success/30',
    dot: 'bg-success',
  },
  MEDIUM: {
    label: 'Medium Risk',
    className: 'bg-drift-teal/15 text-drift-teal border border-drift-teal/30',
    dot: 'bg-drift-teal',
  },
  HIGH: {
    label: 'High Risk',
    className: 'bg-warning/15 text-warning border border-warning/30',
    dot: 'bg-warning',
  },
  EXTREME: {
    label: 'Extreme Risk',
    className: 'bg-error/15 text-error border border-error/30',
    dot: 'bg-error animate-pulse',
  },
}

export function RiskBadge({ tier, className = '' }: RiskBadgeProps) {
  const config = TIER_CONFIG[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-ui ${config.className} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
