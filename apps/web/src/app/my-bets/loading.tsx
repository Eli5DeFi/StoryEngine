/**
 * My Bets loading skeleton.
 * Prevents layout shift and white flash (page is 694KB first load).
 */
export default function MyBetsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header */}
      <div className="border-b border-white/10 bg-void-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <div className="h-5 w-5 bg-white/10 rounded" />
          <div className="h-7 w-32 bg-white/10 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Performance overview */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="h-6 w-40 bg-white/10 rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-8 w-16 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Bets table */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="h-6 w-32 bg-white/10 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
