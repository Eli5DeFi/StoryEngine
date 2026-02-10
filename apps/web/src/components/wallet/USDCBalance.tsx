'use client'

import { DollarSign } from 'lucide-react'
import { useUSDCBalance } from '@/hooks/useUSDCBalance'

/**
 * Display user's USDC balance
 */
export function USDCBalance() {
  const { balance, isLoading } = useUSDCBalance()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg">
        <DollarSign className="w-5 h-5 text-drift-teal animate-pulse" />
        <span className="text-sm text-void-400 font-ui">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 glass-card rounded-lg hover:bg-white/5 transition-colors duration-500">
      <div className="bg-drift-teal/10 p-2 rounded-lg">
        <DollarSign className="w-5 h-5 text-drift-teal" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-ui font-semibold text-foreground tabular-nums">
          ${balance} USDC
        </span>
        <span className="text-xs text-void-400 font-ui">
          Available to bet
        </span>
      </div>
    </div>
  )
}
