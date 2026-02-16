import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { APIResponse, Protocol } from '@/types/lore'

export const metadata = {
  title: 'Protocol Details - Voidborne Lore',
}

const rarityColors = {
  COMMON: '#9ca3af',
  UNCOMMON: '#60a5fa',
  RARE: '#a78bfa',
  EPIC: '#f97316',
  LEGENDARY: '#eab308',
}

async function getProtocol(slug: string): Promise<Protocol | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/lore/protocols/${slug}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch protocol: ${res.statusText}`)
    }

    const json: APIResponse<Protocol> = await res.json()

    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to fetch protocol')
    }

    return json.data
  } catch (error) {
    console.error('Error fetching protocol:', error)
    return null
  }
}

export default async function ProtocolDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const protocol = await getProtocol(params.slug)

  if (!protocol) {
    notFound()
  }

  const rarityColor = rarityColors[protocol.rarity] || rarityColors.COMMON

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <Link
        href="/lore/protocols-dynamic"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Protocols
      </Link>

      {/* Protocol Header */}
      <div
        className="relative mb-8 overflow-hidden rounded-lg border p-8"
        style={{
          borderColor: protocol.house.primaryColor,
          background: `linear-gradient(135deg, ${protocol.house.primaryColor}10 0%, transparent 100%)`,
        }}
      >
        <div
          className="absolute left-0 top-0 h-full w-2"
          style={{ backgroundColor: protocol.house.primaryColor }}
        />

        <div className="flex items-start gap-4">
          {protocol.icon && <span className="text-6xl">{protocol.icon}</span>}
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded bg-primary/10 px-3 py-1 font-mono text-sm font-bold"
                style={{ color: protocol.house.primaryColor }}
              >
                {protocol.code}
              </span>
              <span
                className="rounded bg-muted px-3 py-1 text-xs font-bold uppercase"
                style={{ color: rarityColor }}
              >
                {protocol.rarity}
              </span>
              <span className="rounded bg-muted px-3 py-1 text-xs font-medium uppercase">
                {protocol.spectrum}
              </span>
            </div>
            <h1 className="mb-2 text-4xl font-bold">{protocol.name}</h1>
            <p className="mb-4 text-lg text-muted-foreground">
              {protocol.description}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/lore/houses-dynamic/${protocol.house.slug}`}
                className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
              >
                <span className="text-lg">{protocol.house.icon || '🏛️'}</span>
                <span className="font-medium">{protocol.house.name}</span>
              </Link>
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
                  __html: protocol.lore.replace(/\n/g, '<br />'),
                }}
              />
            </div>
          </section>

          {/* Effects */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Effects</h2>
            <div
              className="rounded-lg border p-6"
              style={{
                borderColor: protocol.house.primaryColor,
                backgroundColor: `${protocol.house.primaryColor}15`,
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: protocol.effects.replace(/\n/g, '<br />'),
                }}
              />
            </div>
          </section>

          {/* Cost */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Cost & Requirements</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <div
                dangerouslySetInnerHTML={{
                  __html: protocol.cost.replace(/\n/g, '<br />'),
                }}
              />
            </div>
          </section>

          {/* Risks */}
          {protocol.risks && (
            <section>
              <h2 className="mb-4 text-2xl font-bold">Risks & Drawbacks</h2>
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
                <div
                  className="text-sm text-destructive"
                  dangerouslySetInnerHTML={{
                    __html: protocol.risks.replace(/\n/g, '<br />'),
                  }}
                />
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* Technical Specs */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">Technical Specifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strand Type</span>
                  <span
                    className="font-bold"
                    style={{ color: protocol.house.primaryColor }}
                  >
                    {protocol.strandType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spectrum</span>
                  <span className="font-bold">{protocol.spectrum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Range</span>
                  <span className="font-bold">{protocol.orderRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power Level</span>
                  <span className="font-bold">{protocol.powerLevel}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rarity</span>
                  <span className="font-bold" style={{ color: rarityColor }}>
                    {protocol.rarity}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">Usage Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Times Used</span>
                  <span className="font-bold">
                    {protocol.timesUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-bold">
                    {protocol.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* House Info */}
            <div
              className="rounded-lg border p-6"
              style={{
                borderColor: protocol.house.primaryColor,
                backgroundColor: `${protocol.house.primaryColor}10`,
              }}
            >
              <h3 className="mb-2 text-lg font-bold">House Origin</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                This protocol was developed by {protocol.house.name}
              </p>
              <Link
                href={`/lore/houses-dynamic/${protocol.house.slug}`}
                className="block w-full rounded-lg px-4 py-2 text-center font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: protocol.house.primaryColor }}
              >
                View House
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
