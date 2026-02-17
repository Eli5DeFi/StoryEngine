/**
 * Leaderboards loading skeleton
 */
export default function LeaderboardsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Title */}
        <div className="h-10 w-64 bg-void-800 rounded mx-auto" />

        {/* Tab bar */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-void-800 rounded-full" />
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-void-900 rounded-xl border border-void-800"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
