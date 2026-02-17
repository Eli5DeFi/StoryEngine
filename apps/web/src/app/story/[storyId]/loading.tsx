/**
 * Story page loading skeleton — shown while JS chunk loads.
 * Mirrors the layout of the story page to reduce CLS.
 */
export default function StoryLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Story Header */}
      <div className="h-24 bg-void-900 border-b border-void-800" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chapter reader */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 w-48 bg-void-800 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-void-900 rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
              ))}
            </div>
            {/* Choice buttons */}
            <div className="space-y-3 pt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-void-900 rounded-xl border border-void-800" />
              ))}
            </div>
          </div>

          {/* Betting sidebar */}
          <div className="space-y-4">
            <div className="h-64 bg-void-900 rounded-xl border border-void-800" />
            <div className="h-48 bg-void-900 rounded-xl border border-void-800" />
          </div>
        </div>
      </div>
    </div>
  )
}
