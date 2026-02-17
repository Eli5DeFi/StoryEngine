/**
 * Analytics loading skeleton
 */
export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-void-900 rounded-xl border border-void-800" />
          ))}
        </div>

        {/* Chart areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-void-900 rounded-xl border border-void-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
