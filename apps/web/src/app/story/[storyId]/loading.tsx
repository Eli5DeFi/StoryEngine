/**
 * Story page loading skeleton.
 * Critical path: story page has 264KB first load JS.
 * This prevents the blank flash while wallet + story data loads.
 */
export default function StoryLoading() {
  return (
    <div className="min-h-screen bg-[#0F172A] animate-pulse">
      {/* Sticky nav */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0F172A]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-6 w-36 bg-white/10 rounded" />
          <div className="flex gap-3">
            <div className="h-9 w-28 bg-white/10 rounded-lg" />
            <div className="h-9 w-28 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chapter header */}
            <div
              className="rounded-2xl p-8"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="h-5 w-24 bg-white/10 rounded mb-4" />
              <div className="h-8 w-3/4 bg-white/10 rounded mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-4 bg-white/5 rounded ${i === 7 ? 'w-2/3' : 'w-full'}`} />
                ))}
              </div>
            </div>

            {/* Chapter navigation */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex justify-between">
                <div className="h-10 w-32 bg-white/10 rounded-lg" />
                <div className="h-10 w-32 bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Betting sidebar */}
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <div className="h-6 w-32 bg-white/10 rounded mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg" />
                ))}
              </div>
              <div className="mt-6 h-12 bg-indigo-500/20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
