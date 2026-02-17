import { BettingPoolSkeleton, ChartSkeleton, ActivityFeedSkeleton } from '@/components/ui/skeleton'

export default function StoryLoading() {
  return (
    <div
      className="min-h-screen bg-background p-6"
      aria-label="Loading story…"
      aria-busy="true"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Story header */}
        <div className="space-y-3">
          <div className="h-10 w-72 animate-pulse rounded bg-void-800/50" />
          <div className="h-4 w-96 animate-pulse rounded bg-void-800/40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BettingPoolSkeleton />
            <ChartSkeleton />
          </div>
          <div className="space-y-6">
            <ActivityFeedSkeleton items={6} />
          </div>
        </div>
      </div>
    </div>
  )
}
