import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HOUSES, getHouseById, PROTAGONISTS } from '@/content/lore';
import { HouseDetail } from '@/components/lore/HouseDetail';

export async function generateStaticParams() {
  return HOUSES.map(house => ({
    houseId: house.id
  }));
}

export async function generateMetadata({ params }: { params: { houseId: string } }) {
  const house = getHouseById(params.houseId);
  if (!house) return {};
  
  return {
    title: `${house.name} - ${house.title}`,
    description: house.description.slice(0, 160),
  };
}

export default function HouseDetailPage({ params }: { params: { houseId: string } }) {
  const house = getHouseById(params.houseId);
  
  if (!house) {
    notFound();
  }

  // Find protagonists from this house
  const houseProtagonists = PROTAGONISTS.filter(p => p.houseId === house.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/lore" className="hover:text-foreground transition-colors">
          Lore
        </Link>
        <span>/</span>
        <Link href="/lore/houses" className="hover:text-foreground transition-colors">
          Houses
        </Link>
        <span>/</span>
        <span className="text-foreground">{house.name}</span>
      </nav>

      {/* Main content */}
      <HouseDetail house={house} />

      {/* Related Characters */}
      {houseProtagonists.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">Key Figures</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {houseProtagonists.map(protagonist => (
              <Link
                key={protagonist.id}
                href={`/lore/characters/${protagonist.id}`}
                className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <h3 className="mb-1 font-bold group-hover:text-primary transition-colors">
                  {protagonist.name}
                </h3>
                <p className="text-sm text-muted-foreground">{protagonist.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/lore/houses"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to All Houses
        </Link>
        <Link
          href="/lore/protocols"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View Protocols →
        </Link>
      </div>
    </div>
  );
}
