/**
 * Guild detail loading skeleton — matches the page layout to reduce CLS.
 */
export default function GuildDetailLoading() {
  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6"
      aria-busy="true"
      aria-label="Loading guild…"
    >
      {/* Hero banner skeleton */}
      <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>

      {/* Content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
