import Link from 'next/link';
import { PROTAGONISTS, getHouseById, getProtocolById } from '@/content/lore';

export const metadata = {
  title: 'The Five Protagonists - Voidborne Lore',
  description: 'Five perspectives on one crisis',
};

export default function CharactersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">The Five Protagonists</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Each protagonist represents a different angle on the central conflict. Their stories will intersect, 
          diverge, and collide. The player/reader sees all five perspectives, gaining information that no single 
          character has. Five agendas. None of them fully right. None of them fully wrong.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {PROTAGONISTS.map(protagonist => {
          const house = getHouseById(protagonist.houseId);
          const protocol = protagonist.protocolId ? getProtocolById(protagonist.protocolId) : null;

          return (
            <Link
              key={protagonist.id}
              href={`/lore/characters/${protagonist.id}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
            >
              {/* Header */}
              <div className="mb-4">
                <h2 className="mb-1 text-2xl font-bold group-hover:text-primary transition-colors">
                  {protagonist.name}
                </h2>
                <p className="text-sm italic text-muted-foreground">
                  {protagonist.title}
                </p>
              </div>

              {/* Tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {house && (
                  <span className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs">
                    <span>{house.icon}</span>
                    <span>{house.name}</span>
                  </span>
                )}
                {protocol && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    <span>{protocol.icon}</span>
                    <span>{protocol.name}</span>
                  </span>
                )}
                {protagonist.order && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {protagonist.order}th Order
                  </span>
                )}
              </div>

              {/* Quote */}
              {protagonist.quote && (
                <blockquote className="mb-4 border-l-2 border-primary pl-4 text-sm italic text-muted-foreground">
                  {protagonist.quote}
                </blockquote>
              )}

              {/* Preview */}
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {protagonist.background.split('\n')[0]}
              </p>

              {/* Hover indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-primary">Read More →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
