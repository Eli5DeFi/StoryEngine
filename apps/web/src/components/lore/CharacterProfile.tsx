import Link from 'next/link';
import type { Protagonist } from '@/content/lore';
import { getHouseById, getProtocolById } from '@/content/lore';

interface CharacterProfileProps {
  character: Protagonist;
}

export function CharacterProfile({ character }: CharacterProfileProps) {
  const house = getHouseById(character.houseId);
  const protocol = character.protocolId ? getProtocolById(character.protocolId) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-4xl font-bold">{character.name}</h1>
        <p className="text-xl italic text-muted-foreground">{character.title}</p>
      </div>

      {/* Affiliation Tags */}
      <div className="flex flex-wrap gap-3">
        {house && (
          <Link
            href={`/lore/houses/${house.id}`}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-all hover:border-primary"
          >
            <span className="text-2xl">{house.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground">House</p>
              <p className="font-semibold group-hover:text-primary transition-colors">
                {house.name}
              </p>
            </div>
          </Link>
        )}
        {protocol && (
          <Link
            href={`/lore/protocols/${protocol.id}`}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-all hover:border-primary"
          >
            <span className="text-2xl">{protocol.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground">Protocol</p>
              <p className="font-semibold group-hover:text-primary transition-colors">
                {protocol.name}
              </p>
            </div>
          </Link>
        )}
        {character.order && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="font-semibold">{character.order}th Order</p>
            </div>
          </div>
        )}
      </div>

      {/* Quote */}
      {character.quote && (
        <blockquote className="border-l-4 border-primary pl-6 italic text-lg">
          {character.quote}
        </blockquote>
      )}

      {/* Background */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-2xl font-bold">Background</h2>
        <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {character.background}
        </div>
      </section>

      {/* The Grey Area */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-2xl font-bold">The Grey Area</h2>
        <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {character.greyArea}
        </div>
      </section>

      {/* Central Question */}
      <section className="rounded-lg border-l-4 border-primary bg-card p-6">
        <h2 className="mb-3 text-xl font-bold">Central Question</h2>
        <p className="text-lg italic leading-relaxed">
          {character.centralQuestion}
        </p>
      </section>

      {/* Traits */}
      {character.traits && character.traits.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Character Traits</h2>
          <div className="flex flex-wrap gap-2">
            {character.traits.map((trait, i) => (
              <span
                key={i}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm"
              >
                {trait}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
