/**
 * Guilds Directory Page — /guilds
 *
 * Innovation Cycle #52 — "The Faction War Engine"
 *
 * Players browse all Guilds, filter by House alignment, and find open guilds
 * to join. The sidebar shows the Void Territory Map and monthly leaderboard.
 *
 * ISR: revalidates every 60s.
 */

import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Metadata } from 'next'

export const revalidate = 60

const GuildsContent = dynamic(
  () =>
    import('@/components/guilds/GuildsContent').then((m) => ({
      default: m.GuildsContent,
    })),
  {
    loading: () => <GuildsSkeleton />,
    ssr: false,
  }
)

export const metadata: Metadata = {
  title: 'Narrative Guilds | Voidborne',
  description:
    'Form a guild. Align to a House. Control Void territory. The top-ranked guild each month injects their narrative agenda into the AI narrator — shaping the story itself.',
  openGraph: {
    title: 'Narrative Guilds | Voidborne',
    description:
      'Factions clash. Territory falls. One guild writes history. Join the Faction Wars.',
    images: ['/og-guilds.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Narrative Guilds | Voidborne',
    description: 'The faction that controls the Void controls the story.',
    images: ['/og-guilds.png'],
  },
}

function GuildsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Stats bar skeleton */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function GuildsPage() {
  return (
    <main className="min-h-screen bg-[#05060b]">
      <Navbar />
      <GuildsContent />
      <Footer />
    </main>
  )
}
