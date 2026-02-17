import { DashboardStatsSkeleton, ChartSkeleton, ActivityFeedSkeleton } from '@/components/ui/skeleton'

/**
 * Dashboard loading state — shown while page data fetches.
 * Next.js automatically renders this while the page Suspense boundary resolves.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6" aria-label="Loading dashboard…" aria-busy="true">
      {/* Header placeholder */}
      <div className="border-b border-gold/20 bg-void-950/50 backdrop-blur sticky top-0 z-50 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 w-48 animate-pulse rounded bg-void-800/50" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <DashboardStatsSkeleton />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ChartSkeleton />
          </div>
          <div className="space-y-6">
            <ActivityFeedSkeleton items={5} />
          </div>
        </div>
      </div>
    </div>
  )
}
