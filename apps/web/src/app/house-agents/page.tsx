/**
 * House Agents Page
 * Route: /house-agents
 *
 * Showcases all 5 autonomous AI House Agents (Innovation Cycle #50 — HAP).
 * Each agent holds a real wallet, bets on chapters, and evolves its personality
 * matrix based on wins/losses.
 *
 * Players can align with a House (earn 20% of winnings) or declare rivalry
 * (earn 10% on agent losses).
 *
 * ISR: revalidates every 60s to reflect new agent bets.
 */

import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const revalidate = 60

// Lazy-load heavy components (framer-motion + recharts)
const HouseAgentsContent = dynamic(
  () => import('@/components/house-agents/HouseAgentsContent').then((m) => ({ default: m.HouseAgentsContent })),
  {
    loading: () => <HouseAgentsSkeleton />,
    ssr: false,
  }
)

export const metadata: Metadata = {
  title: 'House Agents | Voidborne',
  description:
    '5 autonomous AI agents — one per House — place bets aligned with their ideology. Align for 20% yield. Rival for chaos rewards.',
  openGraph: {
    title: 'House Agents | Voidborne',
    description: 'Autonomous AI agents with real wallets. Align. Rival. Earn.',
    images: ['/og-house-agents.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'House Agents | Voidborne',
    description: 'AI agents that bet on the story. Autonomously. Daily.',
    images: ['/og-house-agents.png'],
  },
}

function HouseAgentsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero skeleton */}
      <div className="text-center mb-12">
        <div className="h-8 w-48 bg-white/5 rounded-full mx-auto mb-4 animate-pulse" />
        <div className="h-12 w-96 bg-white/5 rounded-xl mx-auto mb-4 animate-pulse" />
        <div className="h-5 w-64 bg-white/5 rounded-lg mx-auto animate-pulse" />
      </div>

      {/* Stat bar skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-96 bg-white/5 rounded-2xl animate-pulse"
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    </div>
  )
}

export default function HouseAgentsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <Suspense fallback={<HouseAgentsSkeleton />}>
          <HouseAgentsContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  )
}
