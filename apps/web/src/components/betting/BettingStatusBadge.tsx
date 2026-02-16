'use client'

import { useReadContract } from 'wagmi'
import { BETTING_POOL_ADDRESS, BETTING_POOL_ABI } from '@/lib/contracts'

interface BettingStatusBadgeProps {
  chapterId: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function BettingStatusBadge({ 
  chapterId, 
  size = 'md',
  showLabel = true 
}: BettingStatusBadgeProps) {
  const { data: isOpen, isLoading } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'isBettingOpen',
    args: [BigInt(chapterId)],
    query: {
      refetchInterval: 10_000, // Poll every 10 seconds
    },
  })

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E293B] animate-pulse">
        <div className="h-2 w-2 rounded-full bg-[#64748B]" />
        {showLabel && <span className="text-xs text-[#64748B]">Loading...</span>}
      </div>
    )
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  if (isOpen) {
    return (
      <div 
        className={`inline-flex items-center rounded-full transition-all ${sizeClasses[size]}`}
        style={{
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
        }}
      >
        <div 
          className={`rounded-full bg-[#22C55E] ${dotSizeClasses[size]} animate-pulse`}
          style={{
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
          }}
        />
        {showLabel && (
          <span 
            className="font-medium uppercase tracking-[1px] text-[#22C55E]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Betting Open
          </span>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`inline-flex items-center rounded-full transition-all ${sizeClasses[size]}`}
      style={{
        background: 'rgba(220, 38, 38, 0.2)',
        border: '1px solid rgba(220, 38, 38, 0.4)',
      }}
    >
      <div 
        className={`rounded-full bg-[#DC2626] ${dotSizeClasses[size]}`}
      />
      {showLabel && (
        <span 
          className="font-medium uppercase tracking-[1px] text-[#DC2626]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Betting Closed
        </span>
      )}
    </div>
  )
}
