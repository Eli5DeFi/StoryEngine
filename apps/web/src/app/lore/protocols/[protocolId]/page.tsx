import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PROTOCOLS, getProtocolById, PROTAGONISTS } from '@/content/lore';
import { ProtocolDetail } from '@/components/lore/ProtocolDetail';

export async function generateStaticParams() {
  return PROTOCOLS.map(protocol => ({
    protocolId: protocol.id
  }));
}

export async function generateMetadata({ params }: { params: { protocolId: string } }) {
  const protocol = getProtocolById(params.protocolId);
  if (!protocol) return {};
  
  return {
    title: `${protocol.name} (${protocol.code}) - Voidborne Protocols`,
    description: protocol.description.slice(0, 160),
  };
}

export default function ProtocolDetailPage({ params }: { params: { protocolId: string } }) {
  const protocol = getProtocolById(params.protocolId);
  
  if (!protocol) {
    notFound();
  }

  // Find protagonists who use this protocol
  const protocolUsers = PROTAGONISTS.filter(p => p.protocolId === protocol.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/lore" className="hover:text-foreground transition-colors">
          Lore
        </Link>
        <span>/</span>
        <Link href="/lore/protocols" className="hover:text-foreground transition-colors">
          Protocols
        </Link>
        <span>/</span>
        <span className="text-foreground">{protocol.name}</span>
      </nav>

      {/* Main content */}
      <ProtocolDetail protocol={protocol} />

      {/* Known Practitioners */}
      {protocolUsers.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">Known Practitioners</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {protocolUsers.map(protagonist => (
              <Link
                key={protagonist.id}
                href={`/lore/characters/${protagonist.id}`}
                className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <h3 className="mb-1 font-bold group-hover:text-primary transition-colors">
                  {protagonist.name}
                </h3>
                <p className="mb-2 text-sm text-muted-foreground">{protagonist.title}</p>
                {protagonist.order && (
                  <span className="text-xs text-muted-foreground">
                    {protagonist.order}th Order Resonant
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/lore/protocols"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to All Protocols
        </Link>
        <Link
          href="/lore/characters"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View Characters →
        </Link>
      </div>
    </div>
  );
}
