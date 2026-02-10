'use client'

import { Coins } from 'lucide-react'
import { useForgeBalance } from '@/hooks/useForgeBalance'

/**
 * Display user's $FORGE balance
 */
export function ForgeBalance() {
  const { balance, isLoading } = useForgeBalance()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-lg">
        <Coins className="w-5 h-5 text-primary animate-pulse" />
        <span className="text-sm text-foreground/60">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg">
      <Coins className="w-5 h-5 text-primary" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{balance} FORGE</span>
        <span className="text-xs text-foreground/60">Available to bet</span>
      </div>
    </div>
  )
}
