import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PROTAGONISTS, getProtagonistById } from '@/content/lore';
import { CharacterProfile } from '@/components/lore/CharacterProfile';

export async function generateStaticParams() {
  return PROTAGONISTS.map(protagonist => ({
    characterId: protagonist.id
  }));
}

export async function generateMetadata({ params }: { params: { characterId: string } }) {
  const character = getProtagonistById(params.characterId);
  if (!character) return {};
  
  return {
    title: `${character.name} - ${character.title}`,
    description: character.background.slice(0, 160),
  };
}

export default function CharacterDetailPage({ params }: { params: { characterId: string } }) {
  const character = getProtagonistById(params.characterId);
  
  if (!character) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/lore" className="hover:text-foreground transition-colors">
          Lore
        </Link>
        <span>/</span>
        <Link href="/lore/characters" className="hover:text-foreground transition-colors">
          Characters
        </Link>
        <span>/</span>
        <span className="text-foreground">{character.name}</span>
      </nav>

      {/* Main content */}
      <CharacterProfile character={character} />

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/lore/characters"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to All Characters
        </Link>
        <Link
          href="/lore"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Lore Home →
        </Link>
      </div>
    </div>
  );
}
