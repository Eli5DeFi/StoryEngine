/**
 * /auction — Chapter Auction House
 * Innovation Cycle #51: "The Emergent Theater"
 *
 * Every 10th Voidborne chapter is a "Blank Chapter" auctioned to the highest
 * bidder. The winner gets narrative authorship rights + 10% of all bets.
 *
 * ISR: revalidates every 30s to show live bid activity.
 */

import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Suspense } from 'react'
import { Gavel } from 'lucide-react'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'Chapter Auction House | Voidborne',
  description:
    'Every 10th chapter is auctioned to the highest bidder. Win narrative authorship rights, earn 10% of all bets, and receive a Patron NFT.',
  openGraph: {
    title: 'Chapter Auction House | Voidborne',
    description:
      'Commission a chapter. Set the genre. Earn 10% of all bets. The only place in fiction where narrative ownership is auctioned on-chain.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voidborne Auction House',
    description: 'Bid on Blank Chapters. Own the narrative. Earn USDC.',
    creator: '@Eli5DeFi',
  },
}

// Lazy-load heavy client component
const AuctionContent = dynamic(
  () => import('@/components/auction/AuctionContent').then((m) => ({ default: m.AuctionContent })),
  {
    loading: () => <AuctionPageSkeleton />,
    ssr: false,
  }
)

export default function AuctionPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05060b] via-[#1a1508] to-[#05060b]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 800px 400px at 50% 0%, rgba(212,168,83,0.15), transparent)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section marker */}
          <div className="text-center mb-8">
            <div className="text-[10px] uppercase text-void-600 tracking-[4px] mb-6 font-ui">
              Innovation Cycle #51
            </div>
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-2 rounded-full">
              <Gavel className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-ui">Chapter Auction House</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Commission the Narrative.
              <br />
              <span className="text-gold">Earn From It.</span>
            </h1>

            <p className="text-void-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Every 10th chapter is a{' '}
              <span className="text-foreground font-bold">Blank Chapter</span> — auctioned to the
              highest bidder. You choose the genre, the House in the spotlight, and one story twist.
              The AI executes your vision. You earn{' '}
              <span className="text-gold font-bold">10% of all bets</span>.
            </p>

            {/* Live stat pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {[
                { label: 'Next blank chapter', value: 'Ch. 50 — LIVE NOW' },
                { label: 'Current top bid', value: '$6,250 USDC' },
                { label: 'Time remaining', value: '18h 00m' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-4 py-2 rounded-full border border-void-800 bg-void-950/60 text-sm"
                >
                  <span className="text-void-500">{s.label}: </span>
                  <span className="text-foreground font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <Suspense fallback={<AuctionPageSkeleton />}>
        <AuctionContent />
      </Suspense>

      <Footer />
    </main>
  )
}

function AuctionPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-void-900" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-void-900" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-void-900" />
        ))}
      </div>
    </div>
  )
}
