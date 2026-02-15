import Link from 'next/link';
import { HOUSES, PROTOCOLS, PROTAGONISTS } from '@/content/lore';
import { HouseCard } from '@/components/lore/HouseCard';
import { ProtocolCard } from '@/components/lore/ProtocolCard';

export const metadata = {
  title: 'Voidborne: The Silent Throne - Lore',
  description: 'Explore the universe, houses, protocols, and characters of Voidborne',
};

export default function LorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          Voidborne: The Silent Throne
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          A space political sci-fi visual novel where humanity has fractured across seven sovereign Houses. 
          Those who manipulate the Lattice gain powers that look like magic but operate through a deeper physics 
          no one fully understands. Explore the universe, its politics, and the people fighting for its future.
        </p>
      </div>
      
      {/* Houses Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">The Seven Houses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The political powers of the Covenant
            </p>
          </div>
          <Link 
            href="/lore/houses" 
            className="text-primary hover:underline transition-colors"
          >
            View All →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOUSES.slice(0, 6).map(house => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
        {HOUSES.length > 6 && (
          <div className="mt-6 text-center">
            <Link
              href="/lore/houses"
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              View {HOUSES.length - 6} More {HOUSES.length - 6 === 1 ? 'House' : 'Houses'}
            </Link>
          </div>
        )}
      </section>
      
      {/* Protocols Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">The Fourteen Protocols</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The disciplines of Resonance
            </p>
          </div>
          <Link 
            href="/lore/protocols" 
            className="text-primary hover:underline transition-colors"
          >
            View All →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOLS.slice(0, 6).map(protocol => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
        {PROTOCOLS.length > 6 && (
          <div className="mt-6 text-center">
            <Link
              href="/lore/protocols"
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              View {PROTOCOLS.length - 6} More {PROTOCOLS.length - 6 === 1 ? 'Protocol' : 'Protocols'}
            </Link>
          </div>
        )}
      </section>
      
      {/* Characters Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">The Five Protagonists</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Five perspectives on one crisis
            </p>
          </div>
          <Link 
            href="/lore/characters" 
            className="text-primary hover:underline transition-colors"
          >
            View All →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROTAGONISTS.map(protagonist => (
            <Link
              key={protagonist.id}
              href={`/lore/characters/${protagonist.id}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-3">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {protagonist.name}
                </h3>
                <p className="text-sm text-muted-foreground">{protagonist.title}</p>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {protagonist.background.split('\n')[0]}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-1">
                  House {protagonist.houseId}
                </span>
                {protagonist.protocolId && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                    {protagonist.protocolId}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Ready to Experience the Story?</h2>
        <p className="mb-6 text-muted-foreground">
          Every choice shapes the narrative. Every bet determines the future.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start Reading
        </Link>
      </section>
    </div>
  );
}
