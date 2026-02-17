import { DynamicHouseCard } from '@/components/lore/DynamicHouseCard'
import type { APIResponse, House } from '@/types/lore'

export const metadata = {
  title: 'The Seven Houses - Voidborne Lore',
  description: 'The political powers of the Covenant',
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

async function getHouses(): Promise<House[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  
  try {
    const res = await fetch(`${baseUrl}/api/lore/houses`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching houses:', error)
    }
    return []
  }
}

export default async function HousesPage() {
  const houses = await getHouses()

  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Ambient Strand Glow Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" />
        <div 
          className="absolute w-[800px] h-[800px] top-1/4 left-1/4 opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 60%)',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] bottom-1/3 right-1/3 opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 60%)',
            animationDelay: '1s',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* Section Header */}
        <div className="mb-16 text-center opacity-0 animate-fade-in">
          <div className="mb-8" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}>
            <div className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-6">
              The Grand Conclave
            </div>
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#64748B]/20 to-transparent" />
          </div>

          <h1 className="font-display font-extrabold text-[56px] sm:text-[72px] text-[#F1F5F9] mb-6" style={{ letterSpacing: '-1px' }}>
            The Seven Houses
          </h1>
          
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-[#E2E8F0] leading-relaxed mb-4">
            After the Fracturing — a period of catastrophic interstellar wars that
            ended with three Node Fractures and the deaths of 40 billion people —
            the surviving human civilizations formed the Covenant.
          </p>
          
          <p className="max-w-2xl mx-auto text-base text-[#94A3B8] leading-relaxed">
            Seven Houses. One treaty. One rule:{' '}
            <span className="text-[#6366F1] italic">
              No House shall Fracture a Node, and no House shall monopolize the Resonants.
            </span>
          </p>
        </div>

        {/* Houses Grid */}
        {houses.length === 0 ? (
          <div 
            className="rounded-[14px] p-8 text-center"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <p className="text-[#E2E8F0] mb-2">
              No houses found. The database may not be seeded yet.
            </p>
            <p className="text-sm text-[#64748B]">
              Run <code className="rounded bg-[#1E293B] px-2 py-1 font-mono">pnpm db:seed</code> to
              seed the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-0 animate-fade-in [animation-delay:0.2s]">
            {houses.map((house) => (
              <DynamicHouseCard key={house.id} house={house} />
            ))}
          </div>
        )}

        {/* Database Status Indicator */}
        {houses.length > 0 && (
          <div 
            className="mt-12 rounded-[14px] p-4 opacity-0 animate-fade-in [animation-delay:0.3s]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 0 20px rgba(99,102,241,0.08)',
            }}
          >
            <p className="text-sm text-[#6366F1]">
              ✨ <strong>Dynamic Content:</strong> This page fetches house data directly
              from the database. Houses loaded: {houses.length}
            </p>
          </div>
        )}
      </div>

    </main>
  )
}
