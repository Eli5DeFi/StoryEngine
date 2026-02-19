/**
 * Guild Detail Page — /guilds/[guildId]
 *
 * Full guild profile showing:
 * - Hero with house color, tier, score, war record
 * - Active narrative agenda (if agenda holder)
 * - Treasury stats + top bets
 * - Territory control with VoidMap
 * - Member roster
 * - Recent faction wars
 * - Join guild CTA (if recruiting + wallet connected)
 *
 * Innovation Cycle #52 — "The Faction War Engine"
 */

import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import type { Metadata } from 'next'

export const revalidate = 30

// Determine metadata from API (server-side)
export async function generateMetadata({
  params,
}: {
  params: { guildId: string }
}): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://voidborne.vercel.app'
  try {
    const res = await fetch(`${baseUrl}/api/guilds/${params.guildId}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const { guild } = await res.json()
      return {
        title: `${guild.name} ${guild.tag} | Voidborne Guilds`,
        description: guild.description,
        openGraph: {
          title: `${guild.emoji} ${guild.name} — ${guild.house.charAt(0).toUpperCase() + guild.house.slice(1)} Guild | Voidborne`,
          description: `${guild.memberCount} members · ${guild.winRate.toFixed(0)}% win rate · $${(guild.treasuryBalanceUsdc / 1000).toFixed(1)}K treasury`,
        },
      }
    }
  } catch {
    // fallback
  }
  return {
    title: 'Guild | Voidborne',
    description: 'View this Narrative Guild on Voidborne.',
  }
}

const GuildDetailContent = dynamic(
  () =>
    import('@/components/guilds/GuildDetailContent').then((m) => ({
      default: m.GuildDetailContent,
    })),
  {
    loading: () => <GuildDetailSkeleton />,
    ssr: false,
  }
)

function GuildDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
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

export default function GuildDetailPage({
  params,
}: {
  params: { guildId: string }
}) {
  return (
    <main className="min-h-screen bg-[#05060b]">
      <Navbar />
      <GuildDetailContent guildId={params.guildId} />
      <Footer />
    </main>
  )
}
