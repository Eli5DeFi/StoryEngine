/**
 * Analytics loading skeleton.
 */
export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="border-b border-white/10 bg-void-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-7 w-40 bg-white/10 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="h-4 w-20 bg-white/10 rounded mb-3" />
              <div className="h-8 w-28 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="h-6 w-32 bg-white/10 rounded mb-6" />
          <div className="h-64 bg-white/5 rounded-lg" />
        </div>

        {/* Leaderboard skeleton */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="h-6 w-36 bg-white/10 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
