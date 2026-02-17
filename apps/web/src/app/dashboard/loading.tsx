/**
 * Dashboard loading skeleton
 * Shown immediately while the page JS chunk loads — eliminates blank flash.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-gold/20 bg-void-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-void-800 rounded" />
            <div className="flex gap-3">
              <div className="h-9 w-24 bg-void-800 rounded-lg" />
              <div className="h-9 w-28 bg-void-800 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Platform Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-void-900 rounded-xl border border-void-800" />
          ))}
        </div>

        {/* Community Pulse skeleton */}
        <div className="h-64 bg-void-900 rounded-xl border border-void-800" />

        {/* Activity Feed skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-void-900 rounded-lg border border-void-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
