/**
 * Auction detail loading skeleton — avoids layout shift on navigation.
 */
export default function AuctionDetailLoading() {
  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6"
      aria-busy="true"
      aria-label="Loading auction…"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="h-7 w-1/2 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-4 w-1/4 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Countdown skeleton */}
      <div className="h-24 rounded-xl bg-white/5 animate-pulse" />

      {/* Bid history skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>

      {/* Bid form skeleton */}
      <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
    </div>
  )
}
