/**
 * Story loading UI — shown by Next.js while the page is being rendered.
 * Using a content-shaped skeleton reduces CLS vs a bare spinner.
 */
export default function StoryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8"
        aria-busy="true"
        aria-label="Loading story…"
      >
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-2/3 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Chapter body skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-white/5 rounded animate-pulse"
              style={{ width: i % 3 === 2 ? '70%' : '100%' }}
            />
          ))}
        </div>

        {/* Betting panel skeleton */}
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
