import Link from 'next/link'

/**
 * Custom 404 page — styled to match Voidborne's dark space aesthetic.
 * Replaces the default Next.js /_not-found page (currently 879B, 91.4KB JS).
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Decorative number */}
        <div
          className="text-[120px] font-bold leading-none mb-4 select-none"
          style={{
            background: 'linear-gradient(135deg, #1E1B3A 0%, #2D2B5A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
          }}
          aria-hidden="true"
        >
          404
        </div>

        <h1 className="text-2xl font-bold text-[#F1F5F9] mb-3">
          Beyond the Known Void
        </h1>
        <p className="text-[#94A3B8] mb-8 text-sm leading-relaxed">
          This region of the Lattice has not yet been charted. The page you seek may have shifted or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            }}
          >
            Return to the Throne
          </Link>
          <Link
            href="/lore"
            className="px-6 py-3 rounded-lg font-semibold text-[#E2E8F0] transition-all hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Explore Lore
          </Link>
        </div>
      </div>
    </div>
  )
}
