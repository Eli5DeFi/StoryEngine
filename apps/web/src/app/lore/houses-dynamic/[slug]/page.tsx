import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { APIResponse, House } from '@/types/lore'

export const metadata = {
  title: 'House Details - Voidborne Lore',
}

async function getHouse(slug: string): Promise<House | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/lore/houses/${slug}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch house: ${res.statusText}`)
    }

    const json: APIResponse<House> = await res.json()

    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to fetch house')
    }

    return json.data
  } catch (error) {
    console.error('Error fetching house:', error)
    return null
  }
}

export default async function HouseDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const house = await getHouse(params.slug)

  if (!house) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" />
        <div 
          className="absolute w-[800px] h-[800px] top-1/4 right-1/4 opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(ellipse, ${house.primaryColor}30 0%, transparent 60%)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* Back Navigation */}
        <Link
          href="/lore/houses-dynamic"
          className="inline-flex items-center gap-2 text-sm text-[#94A3B8] transition-colors hover:text-[#6366F1] mb-8 opacity-0 animate-fade-in"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO HOUSES
        </Link>

        {/* House Header */}
        <div
          className="relative mb-12 overflow-hidden rounded-[20px] p-8 sm:p-12 opacity-0 animate-fade-in [animation-delay:0.1s]"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${house.primaryColor}60`,
            boxShadow: `0 0 40px ${house.primaryColor}20`,
          }}
        >
          {/* Accent Glow */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 20% 30%, ${house.primaryColor}20, transparent 60%)`,
            }}
          />

          {/* Color Accent Bar */}
          <div
            className="absolute left-0 top-0 h-full w-2"
            style={{ backgroundColor: house.primaryColor }}
          />

          <div className="relative flex items-start gap-6">
            <span className="text-7xl sm:text-8xl filter drop-shadow-2xl">{house.icon || '🏛️'}</span>
            <div className="flex-1">
              <h1 className="font-display font-extrabold text-5xl sm:text-6xl text-[#F1F5F9] mb-4" style={{ letterSpacing: '-1px' }}>
                {house.name}
              </h1>
              <p className="text-lg sm:text-xl text-[#E2E8F0] mb-6 leading-relaxed">
                {house.description}
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span 
                    className="text-[10px] uppercase tracking-[2px] text-[#64748B] block mb-1"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    STRAND TYPE
                  </span>
                  <span className="font-bold text-lg" style={{ color: house.primaryColor }}>
                    {house.strandType}-Strand
                  </span>
                </div>
                <div>
                  <span 
                    className="text-[10px] uppercase tracking-[2px] text-[#64748B] block mb-1"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    TERRITORY
                  </span>
                  <span className="font-medium text-[#F1F5F9]">{house.territory || 'Unknown'}</span>
                </div>
                <div>
                  <span 
                    className="text-[10px] uppercase tracking-[2px] text-[#64748B] block mb-1"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    POPULATION
                  </span>
                  <span className="font-medium text-[#F1F5F9]">
                    {house.population?.toLocaleString() || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lore Section */}
            <section className="opacity-0 animate-fade-in [animation-delay:0.2s]">
              <h2 
                className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                LORE
              </h2>
              <div
                className="rounded-[14px] p-6 sm:p-8"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(100, 116, 139, 0.2)',
                }}
              >
                <div
                  className="prose prose-invert prose-lg max-w-none text-[#E2E8F0] leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: house.lore.replace(/\n/g, '<br />'),
                  }}
                />
              </div>
            </section>

            {/* Strand Mastery */}
            <section className="opacity-0 animate-fade-in [animation-delay:0.3s]">
              <h2 
                className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                STRAND MASTERY
              </h2>
              <div
                className="rounded-[14px] p-6 sm:p-8"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${house.primaryColor}40`,
                  boxShadow: `0 0 30px ${house.primaryColor}15`,
                }}
              >
                <p className="text-lg text-[#E2E8F0] leading-relaxed">{house.strandDescription}</p>
              </div>
            </section>

            {/* Protocols */}
            <section className="opacity-0 animate-fade-in [animation-delay:0.4s]">
              <h2 
                className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                HOUSE PROTOCOLS ({house.protocolCount})
              </h2>
              {house.protocols && house.protocols.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {house.protocols.map((protocol) => (
                    <Link
                      key={protocol.id}
                      href={`/lore/protocols/${protocol.slug}`}
                      className="group rounded-[14px] p-4 transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${house.primaryColor}30`,
                      }}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <span
                          className="rounded-full px-3 py-1 font-mono text-xs font-bold"
                          style={{ 
                            background: `${house.primaryColor}20`,
                            color: house.primaryColor,
                            border: `1px solid ${house.primaryColor}40`,
                          }}
                        >
                          {protocol.code}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {protocol.rarity}
                        </span>
                      </div>
                      <h3 className="mb-2 font-bold text-[#F1F5F9] group-hover:text-[#E2E8F0]">
                        {protocol.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <span>Power: {protocol.powerLevel}/10</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-[14px] p-6 text-center"
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(100, 116, 139, 0.2)',
                  }}
                >
                  <p className="text-[#64748B]">
                    No protocols recorded for this house yet.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* House Statistics */}
              <div 
                className="rounded-[14px] p-6 opacity-0 animate-fade-in [animation-delay:0.5s]"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${house.primaryColor}40`,
                  boxShadow: `0 0 20px ${house.primaryColor}15`,
                }}
              >
                <h3 
                  className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-6"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  STATISTICS
                </h3>
                <div className="space-y-4">
                  <StatRow label="Influence" value={`${house.influence}/1000`} />
                  <StatRow label="Reputation" value={house.reputation.toString()} />
                  <StatRow label="Members" value={house.memberCount.toLocaleString()} />
                  <StatRow label="Protocols" value={house.protocolCount.toString()} />
                  <StatRow label="Total Bets" value={`$${house.totalBets.toLocaleString()}`} />
                  <StatRow label="Wins" value={house.totalWins.toString()} />
                  <StatRow label="Win Rate" value={`${house.winRate.toFixed(1)}%`} />
                </div>
              </div>

              {/* Join House CTA */}
              <div
                className="rounded-[14px] p-6 text-center opacity-0 animate-fade-in [animation-delay:0.6s]"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${house.primaryColor}60`,
                  boxShadow: `0 0 30px ${house.primaryColor}20`,
                }}
              >
                <h3 className="font-display text-xl font-bold text-[#F1F5F9] mb-2">
                  Join {house.name}
                </h3>
                <p className="text-sm text-[#94A3B8] mb-4">
                  Align yourself with this house and earn reputation
                </p>
                <button
                  className="w-full rounded-lg px-6 py-3 font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: house.primaryColor }}
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span 
        className="text-[10px] uppercase tracking-[2px] text-[#64748B]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      <span className="font-display font-bold text-[#F1F5F9] tabular-nums">
        {value}
      </span>
    </div>
  )
}
