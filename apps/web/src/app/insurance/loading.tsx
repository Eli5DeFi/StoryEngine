/**
 * Insurance page loading skeleton
 */
export default function InsuranceLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="h-10 w-72 bg-void-800 rounded" />
        <div className="h-5 w-96 bg-void-900 rounded" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-void-900 rounded-xl border border-void-800" />
          ))}
        </div>

        {/* Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-void-900 rounded-xl border border-void-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
