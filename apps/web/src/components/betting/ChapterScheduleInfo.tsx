'use client'

import { useReadContract } from 'wagmi'
import { BETTING_POOL_ADDRESS, BETTING_POOL_ABI } from '@/lib/contracts'

interface ChapterScheduleInfoProps {
  chapterId: number
}

export function ChapterScheduleInfo({ chapterId }: ChapterScheduleInfoProps) {
  const { data: schedule, isLoading } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'getChapterSchedule',
    args: [BigInt(chapterId)],
    query: {
      refetchInterval: 30_000, // Poll every 30 seconds
    },
  })

  if (isLoading) {
    return (
      <div 
        className="rounded-[14px] p-6 animate-pulse"
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(100, 116, 139, 0.2)',
        }}
      >
        <div className="h-6 bg-[#1E293B] rounded mb-3 w-48" />
        <div className="space-y-2">
          <div className="h-4 bg-[#1E293B] rounded w-full" />
          <div className="h-4 bg-[#1E293B] rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div 
        className="rounded-[14px] p-6"
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <h3 className="font-display font-bold text-lg text-[#F1F5F9] mb-2">
          Chapter Not Scheduled
        </h3>
        <p className="text-sm text-[#94A3B8]">
          This chapter hasn&apos;t been scheduled for generation yet.
        </p>
      </div>
    )
  }

  const [generationTime, bettingDeadline, published, bettingOpen] = schedule as [
    bigint,
    bigint,
    boolean,
    boolean
  ]

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  }

  return (
    <div 
      className="rounded-[14px] p-6"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${bettingOpen ? 'rgba(99, 102, 241, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
      }}
    >
      <h3 
        className="text-xs uppercase tracking-[2px] text-[#64748B] mb-4"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Chapter Schedule
      </h3>

      <div className="space-y-4">
        {/* Betting Deadline */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔔</span>
            <span className="text-sm text-[#94A3B8]">Betting Closes</span>
          </div>
          <p className="font-display font-bold text-lg text-[#F1F5F9] ml-7">
            {formatTimestamp(bettingDeadline)}
          </p>
        </div>

        {/* Generation Time */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🤖</span>
            <span className="text-sm text-[#94A3B8]">Story Generation</span>
          </div>
          <p className="font-display font-bold text-lg text-[#F1F5F9] ml-7">
            {formatTimestamp(generationTime)}
          </p>
        </div>

        {/* Status */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📊</span>
            <span className="text-sm text-[#94A3B8]">Status</span>
          </div>
          <div className="ml-7 flex items-center gap-3">
            <span 
              className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-[1px]`}
              style={{
                background: published 
                  ? 'rgba(34, 197, 94, 0.2)' 
                  : 'rgba(99, 102, 241, 0.2)',
                color: published ? '#22C55E' : '#6366F1',
                border: published 
                  ? '1px solid rgba(34, 197, 94, 0.4)' 
                  : '1px solid rgba(99, 102, 241, 0.4)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {published ? 'Published' : 'Scheduled'}
            </span>
            {bettingOpen && (
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-[1px]"
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#22C55E',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Betting Open
              </span>
            )}
          </div>
        </div>

        {/* 1-Hour Buffer Note */}
        <div 
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            <span className="text-[#6366F1] font-medium">ℹ️ Anti-Botting Protection:</span>{' '}
            Betting closes 1 hour before story generation to ensure fair play.
          </p>
        </div>
      </div>
    </div>
  )
}
