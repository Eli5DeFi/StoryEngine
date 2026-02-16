import { DynamicHouseCard } from '@/components/lore/DynamicHouseCard'
import type { APIResponse, House } from '@/types/lore'

export const metadata = {
  title: 'The Seven Houses - Voidborne Lore',
  description: 'The political powers of the Covenant',
}

async function getHouses(): Promise<House[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  
  try {
    const res = await fetch(`${baseUrl}/api/lore/houses`, {
      cache: 'no-store', // Always fetch fresh data
    })
    
    if (!res.ok) {
      throw new Error(`Failed to fetch houses: ${res.statusText}`)
    }
    
    const json: APIResponse<House[]> = await res.json()
    
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to fetch houses')
    }
    
    return json.data
  } catch (error) {
    console.error('Error fetching houses:', error)
    return []
  }
}

export default async function HousesPage() {
  const houses = await getHouses()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">The Seven Houses</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          After the Fracturing — a period of catastrophic interstellar wars that
          ended with three Node Fractures and the deaths of 40 billion people —
          the surviving human civilizations formed the Covenant. Seven Houses. One
          treaty. One rule:{' '}
          <em>
            No House shall Fracture a Node, and no House shall monopolize the
            Resonants.
          </em>
        </p>
      </div>

      {houses.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No houses found. The database may not be seeded yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-2 py-1">pnpm db:seed</code> to
            seed the database.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <DynamicHouseCard key={house.id} house={house} />
          ))}
        </div>
      )}

      {/* Database status indicator */}
      <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-primary">
          ✨ <strong>Dynamic Content:</strong> This page fetches house data directly
          from the database. Houses: {houses.length}
        </p>
      </div>
    </div>
  )
}
