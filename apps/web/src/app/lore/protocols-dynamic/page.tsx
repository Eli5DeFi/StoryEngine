import { DynamicProtocolCard } from '@/components/lore/DynamicProtocolCard'
import type { APIResponse, Protocol } from '@/types/lore'

export const metadata = {
  title: 'Protocols - Voidborne Lore',
  description: 'Reality-shaping techniques mastered by the Seven Houses',
}

async function getProtocols(): Promise<Protocol[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/lore/protocols`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch protocols: ${res.statusText}`)
    }

    const json: APIResponse<Protocol[]> = await res.json()

    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to fetch protocols')
    }

    return json.data
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return []
  }
}

export default async function ProtocolsPage() {
  const protocols = await getProtocols()

  // Group by strand type
  const protocolsByStrand = protocols.reduce(
    (acc, protocol) => {
      if (!acc[protocol.strandType]) {
        acc[protocol.strandType] = []
      }
      acc[protocol.strandType].push(protocol)
      return acc
    },
    {} as Record<string, Protocol[]>
  )

  const strandOrder = ['G', 'L', 'S', 'R', 'C', 'Ø']
  const strandNames = {
    G: 'Gravity Strand',
    L: 'Lattice Strand',
    S: 'Stitch Strand',
    R: 'Radiance Strand',
    C: 'Code Strand',
    Ø: 'Null Strand',
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Protocols</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Protocols are reality-shaping techniques developed and refined by the Seven
          Houses. Each Protocol manipulates one of the six fundamental Strands that
          hold the universe together. Mastery requires years of training — and the
          wrong Protocol at the wrong time can tear reality itself.
        </p>
      </div>

      {protocols.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No protocols found. The database may not be seeded yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-2 py-1">pnpm db:seed</code> to
            seed the database.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {strandOrder.map((strandType) => {
            const strandProtocols = protocolsByStrand[strandType]
            if (!strandProtocols || strandProtocols.length === 0) return null

            return (
              <section key={strandType}>
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold">
                    {strandNames[strandType as keyof typeof strandNames] ||
                      `${strandType}-Strand`}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {strandProtocols.length} protocol
                    {strandProtocols.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {strandProtocols.map((protocol) => (
                    <DynamicProtocolCard key={protocol.id} protocol={protocol} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Database status indicator */}
      <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-primary">
          ✨ <strong>Dynamic Content:</strong> This page fetches protocol data
          directly from the database. Protocols: {protocols.length}
        </p>
      </div>
    </div>
  )
}
