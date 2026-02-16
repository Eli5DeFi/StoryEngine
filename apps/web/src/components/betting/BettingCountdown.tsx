'use client'

import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'
import { BETTING_POOL_ADDRESS, BETTING_POOL_ABI } from '@/lib/contracts'

interface BettingCountdownProps {
  chapterId: number
  className?: string
}

export function BettingCountdown({ chapterId, className = '' }: BettingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  // Fetch deadline from contract
  const { data: deadline, isLoading } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'getTimeUntilDeadline',
    args: [BigInt(chapterId)],
    // Poll every 10 seconds
    query: {
      refetchInterval: 10_000,
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (deadline) {
      setTimeRemaining(Number(deadline))
    }
  }, [deadline])

  // Countdown timer (updates every second)
  useEffect(() => {
    if (timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  if (!mounted) return null
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-[#1E293B] rounded w-48" />
      </div>
    )
  }

  if (timeRemaining === 0) {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${className}`}
        style={{
          background: 'rgba(220, 38, 38, 0.2)',
          border: '1px solid rgba(220, 38, 38, 0.4)',
        }}
      >
        <span className="text-2xl">🔒</span>
        <div>
          <div 
            className="text-xs uppercase tracking-[2px] text-[#DC2626]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            BETTING CLOSED
          </div>
          <div className="text-sm text-[#FCA5A5]">
            Story generation in progress
          </div>
        </div>
      </div>
    )
  }

  const hours = Math.floor(timeRemaining / 3600)
  const minutes = Math.floor((timeRemaining % 3600) / 60)
  const seconds = timeRemaining % 60

  // Color coding based on time remaining
  const isUrgent = timeRemaining < 3600 // Less than 1 hour
  const isWarning = timeRemaining < 7200 // Less than 2 hours

  const bgColor = isUrgent 
    ? 'rgba(220, 38, 38, 0.2)' 
    : isWarning 
    ? 'rgba(245, 158, 11, 0.2)' 
    : 'rgba(99, 102, 241, 0.2)'

  const borderColor = isUrgent 
    ? 'rgba(220, 38, 38, 0.4)' 
    : isWarning 
    ? 'rgba(245, 158, 11, 0.4)' 
    : 'rgba(99, 102, 241, 0.4)'

  const textColor = isUrgent 
    ? '#DC2626' 
    : isWarning 
    ? '#F59E0B' 
    : '#6366F1'

  return (
    <div 
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg ${className}`}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <span className="text-2xl">⏰</span>
      <div>
        <div 
          className="text-xs uppercase tracking-[2px] mb-1"
          style={{ 
            fontFamily: 'var(--font-mono)',
            color: textColor,
          }}
        >
          BETTING CLOSES IN
        </div>
        <div 
          className="font-display font-bold text-lg tabular-nums"
          style={{ color: textColor }}
        >
          {hours > 0 && `${hours}h `}
          {minutes}m {seconds}s
        </div>
      </div>
    </div>
  )
}
