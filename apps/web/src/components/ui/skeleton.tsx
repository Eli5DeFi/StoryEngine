/**
 * Enhanced Loading Skeletons for Voidborne
 * 
 * Provides visual feedback during async operations,
 * reducing perceived load time and improving UX.
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-void-800/50',
        className
      )}
    />
  )
}

/**
 * Chart Loading Skeleton
 * Used for OddsChart, ConsensusGauge, etc.
 */
export function ChartSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 border border-void-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-6 w-32 rounded" />
      </div>
      
      {/* Chart area */}
      <Skeleton className="h-64 rounded" />
      
      {/* Legend/stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-lg border border-void-800 bg-void-900/30">
            <Skeleton className="h-4 w-20 rounded mb-2" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Betting Pool Card Skeleton
 */
export function BettingPoolSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 border border-void-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-6 w-24 rounded" />
      </div>
      
      {/* Story info */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      
      {/* Choices */}
      <div className="space-y-3 mb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-lg border border-void-800">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-10 w-24 rounded" />
      </div>
    </div>
  )
}

/**
 * Leaderboard Row Skeleton
 */
export function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-xl p-6 border border-void-800">
      <Skeleton className="h-8 w-48 rounded mb-6" />
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-void-800">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="h-4 w-32 rounded flex-1" />
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Story Card Skeleton
 */
export function StoryCardSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden border border-void-800">
      {/* Cover image */}
      <Skeleton className="h-48 w-full" />
      
      {/* Content */}
      <div className="p-6">
        <Skeleton className="h-6 w-3/4 rounded mb-3" />
        <Skeleton className="h-4 w-full rounded mb-2" />
        <Skeleton className="h-4 w-5/6 rounded mb-4" />
        
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Activity Feed Skeleton
 */
export function ActivityFeedSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-void-800 bg-void-900/30">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 rounded mb-2" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Dashboard Stats Skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass-card rounded-xl p-6 border border-void-800">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <Skeleton className="h-8 w-32 rounded mb-2" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Full Page Loading Skeleton
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>
      
      {/* Stats */}
      <DashboardStatsSkeleton />
      
      {/* Main content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartSkeleton />
          <BettingPoolSkeleton />
        </div>
        
        <div className="space-y-6">
          <LeaderboardSkeleton rows={5} />
          <ActivityFeedSkeleton items={3} />
        </div>
      </div>
    </div>
  )
}
