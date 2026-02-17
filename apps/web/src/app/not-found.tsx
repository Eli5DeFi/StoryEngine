import Link from 'next/link'

/**
 * Global 404 page.
 * Shown when a route is not found — replaces the default Next.js 404.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Decorative glitch code */}
        <div className="text-[120px] font-bold text-[#1E293B] leading-none select-none" aria-hidden="true">
          404
        </div>

        <h1 className="text-2xl font-display text-[#F1F5F9] mb-3 -mt-4">
          Lost in the Void
        </h1>
        <p className="text-[#94A3B8] mb-8 leading-relaxed">
          This page has been consumed by the silence between stars. The Silent Throne
          holds no record of what you sought.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-[#F1F5F9] transition-all"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            Return Home
          </Link>
          <Link
            href="/lore"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Explore the Lore
          </Link>
        </div>
      </div>
    </div>
  )
}
