/**
 * /live — Live Narrative Broadcast
 * Innovation Cycle #51: "The Emergent Theater"
 *
 * The Twitch of interactive fiction. Chapter text streams live, word by word.
 * Mid-stream betting windows open and close. Thousands watch together.
 *
 * Uses LiveNarrativeStudio.tsx (SSE-connected, real-time odds, payout display)
 */

import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Radio } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Live Narrative Broadcast | Voidborne',
  description:
    'Watch AI generate a chapter live. Bet mid-stream. Watch odds shift in real time as 5,000 readers react together. The Twitch of interactive fiction.',
  openGraph: {
    title: '🔴 LIVE — Voidborne Narrative Broadcast',
    description:
      'Chapter 49 is streaming now. $80K+ in bets. A choice coming that will change everything.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🔴 LIVE on Voidborne',
    description: 'Watch the chapter generate. Bet mid-stream. Win USDC.',
    creator: '@Eli5DeFi',
  },
}

// LiveNarrativeStudio is already optimized for SSE streaming — lazy load it
const LiveNarrativeStudio = dynamic(
  () => import('@/components/LiveNarrativeStudio'),
  {
    ssr: false,
    loading: () => <LivePageSkeleton />,
  }
)

// In production, pull broadcastId from DB (current active broadcast)
// For now: use a well-known mock broadcast ID
const CURRENT_BROADCAST_ID = 'broadcast-chapter-49-live'

export default function LivePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Live indicator header */}
      <section className="pt-20 pb-4 border-b border-void-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Live badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs font-ui uppercase tracking-wider">Live</span>
              </div>
              <div>
                <h1 className="text-foreground font-display font-bold text-lg leading-tight">
                  Chapter 49: The Meridian Threshold
                </h1>
                <p className="text-void-500 text-xs font-ui">
                  Voidborne — The Silent Throne
                </p>
              </div>
            </div>

            {/* Right: Quick stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-void-400">
                <Radio className="w-4 h-4 text-red-400" />
                <span className="font-mono font-bold text-foreground">4,847</span>
                <span>watching</span>
              </div>
              <div className="text-void-400">
                Pool: <span className="text-gold font-mono font-bold">$83,200</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Studio — main live experience */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveNarrativeStudio
            broadcastId={CURRENT_BROADCAST_ID}
            chapterId="chapter-49"
          />
        </div>
      </section>

      {/* Context footer */}
      <section className="py-8 border-t border-void-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            <div className="space-y-1">
              <h3 className="text-void-400 uppercase tracking-wider text-xs font-ui">Story Arc</h3>
              <p className="text-void-200">
                The Meridian fleet approaches Senate space. Three Houses have secretly pledged support
                to House Meridian — but one is lying.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-void-400 uppercase tracking-wider text-xs font-ui">How Betting Works</h3>
              <p className="text-void-200">
                Betting windows open when the AI reaches a narrative decision point. You have 60-90
                seconds to place your bet before the AI continues. Winners split the pool.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-void-400 uppercase tracking-wider text-xs font-ui">Next Live Chapter</h3>
              <p className="text-void-200">
                Chapter 50 broadcasts in <span className="text-gold font-bold">24 hours</span>.
                Chapter 50 is also a{' '}
                <a href="/auction/50" className="text-gold underline hover:text-gold-light">
                  Blank Chapter — currently being auctioned
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function LivePageSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-6">
      {/* Text stream placeholder */}
      <div className="rounded-2xl border border-void-800 bg-void-950/60 p-8 space-y-3 min-h-[300px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-void-900"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
      {/* Betting window placeholder */}
      <div className="rounded-2xl border border-void-800 bg-void-950/60 p-6 h-40" />
    </div>
  )
}
