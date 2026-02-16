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
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <Link
        href="/lore/houses-dynamic"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Houses
      </Link>

      {/* House Header */}
      <div
        className="relative mb-8 overflow-hidden rounded-lg border p-8"
        style={{
          borderColor: house.primaryColor,
          background: `linear-gradient(135deg, ${house.primaryColor}10 0%, transparent 100%)`,
        }}
      >
        <div
          className="absolute left-0 top-0 h-full w-2"
          style={{ backgroundColor: house.primaryColor }}
        />

        <div className="flex items-start gap-4">
          <span className="text-6xl">{house.icon || '🏛️'}</span>
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold">{house.name}</h1>
            <p className="mb-4 text-lg text-muted-foreground">
              {house.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Strand Type:</span>{' '}
                <span className="font-bold" style={{ color: house.primaryColor }}>
                  {house.strandType}-Strand
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Territory:</span>{' '}
                <span className="font-medium">{house.territory || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Population:</span>{' '}
                <span className="font-medium">
                  {house.population?.toLocaleString() || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Lore */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Lore</h2>
            <div className="prose prose-invert max-w-none rounded-lg border border-border bg-card p-6">
              <div
                dangerouslySetInnerHTML={{
                  __html: house.lore.replace(/\n/g, '<br />'),
                }}
              />
            </div>
          </section>

          {/* Strand Description */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Strand Mastery</h2>
            <div
              className="rounded-lg border p-6"
              style={{
                borderColor: house.primaryColor,
                backgroundColor: `${house.primaryColor}15`,
              }}
            >
              <p className="text-lg">{house.strandDescription}</p>
            </div>
          </section>

          {/* Protocols */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">
              House Protocols ({house.protocolCount})
            </h2>
            {house.protocols && house.protocols.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {house.protocols.map((protocol) => (
                  <Link
                    key={protocol.id}
                    href={`/lore/protocols/${protocol.slug}`}
                    className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span
                        className="rounded bg-primary/10 px-2 py-1 font-mono text-xs font-bold"
                        style={{ color: house.primaryColor }}
                      >
                        {protocol.code}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {protocol.rarity}
                      </span>
                    </div>
                    <h3 className="mb-1 font-bold group-hover:text-primary">
                      {protocol.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Power: {protocol.powerLevel}/10</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No protocols recorded for this house yet.
              </p>
            )}
          </section>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* House Stats */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">House Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Influence</span>
                  <span className="font-bold">{house.influence}/1000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reputation</span>
                  <span className="font-bold">{house.reputation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-bold">{house.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protocols</span>
                  <span className="font-bold">{house.protocolCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bets</span>
                  <span className="font-bold">
                    ${house.totalBets.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-bold">{house.totalWins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-bold">{house.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Join House CTA */}
            <div
              className="rounded-lg border p-6 text-center"
              style={{
                borderColor: house.primaryColor,
                backgroundColor: `${house.primaryColor}10`,
              }}
            >
              <h3 className="mb-2 text-lg font-bold">Join {house.name}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Align yourself with this house and earn reputation
              </p>
              <button
                className="w-full rounded-lg px-4 py-2 font-bold text-white transition-all hover:opacity-90"
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
  )
}
