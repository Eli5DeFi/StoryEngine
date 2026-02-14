import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@voidborne/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stories/[storyId]/characters
 * Get all characters for a story with their memories and relationships
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;

    // Get all characters for this story
    const characters = await prisma.character.findMany({
      where: { storyId },
      include: {
        memories: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        relationships: {
          include: {
            characterB: true,
          },
        },
        relatedTo: {
          include: {
            characterA: true,
          },
        },
      },
      orderBy: {
        firstAppearance: 'asc',
      },
    });

    // Transform relationships to be simpler
    const charactersWithRelationships = characters.map((char) => {
      const allRelationships = [
        ...char.relationships.map((rel) => ({
          id: rel.id,
          character: {
            id: rel.characterB.id,
            name: rel.characterB.name,
          },
          type: rel.relationshipType,
          score: rel.score,
          history: rel.history,
        })),
        ...char.relatedTo.map((rel) => ({
          id: rel.id,
          character: {
            id: rel.characterA.id,
            name: rel.characterA.name,
          },
          type: rel.relationshipType,
          score: rel.score,
          history: rel.history,
        })),
      ];

      return {
        id: char.id,
        name: char.name,
        description: char.description,
        portrait: char.portrait,
        traits: char.traits,
        firstAppearance: char.firstAppearance,
        lastAppearance: char.lastAppearance,
        totalAppearances: char.totalAppearances,
        memories: char.memories,
        relationships: allRelationships,
      };
    });

    return NextResponse.json({ characters: charactersWithRelationships });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
