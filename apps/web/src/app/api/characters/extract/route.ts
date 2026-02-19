import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@voidborne/database';
import OpenAI from 'openai';
import { logger } from '@/lib/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

interface CharacterExtraction {
  characters: Array<{
    name: string;
    description: string;
    traits: Record<string, number>;
    memories: Array<{
      event: string;
      type: 'DECISION' | 'RELATIONSHIP' | 'REVELATION' | 'TRAUMA' | 'ACHIEVEMENT';
      emotionalImpact: number;
      importance: number;
    }>;
  }>;
  relationships: Array<{
    characterA: string;
    characterB: string;
    type: 'FAMILY' | 'FRIEND' | 'ROMANTIC' | 'RIVAL' | 'MENTOR' | 'ENEMY' | 'ALLY' | 'NEUTRAL';
    score: number;
    reason: string;
  }>;
}

/**
 * POST /api/characters/extract
 * Extract characters, traits, and relationships from a chapter
 * 
 * Body:
 * - chapterId: string
 */
export async function POST(request: NextRequest) {
  try {
    const { chapterId } = await request.json();

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required' },
        { status: 400 }
      );
    }

    // Get chapter content
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        story: true,
        choices: {
          where: { isChosen: true },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Extract characters using GPT-4o
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract characters, traits, and relationships from this chapter.
          
Return JSON:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief 1-2 sentence description",
      "traits": { "brave": 0.8, "impulsive": 0.6, "loyal": 0.9 },
      "memories": [
        {
          "event": "What happened in this chapter",
          "type": "DECISION|RELATIONSHIP|REVELATION|TRAUMA|ACHIEVEMENT",
          "emotionalImpact": 0.9,
          "importance": 10
        }
      ]
    }
  ],
  "relationships": [
    {
      "characterA": "Character A Name",
      "characterB": "Character B Name",
      "type": "FAMILY|FRIEND|ROMANTIC|RIVAL|MENTOR|ENEMY|ALLY|NEUTRAL",
      "score": 0.9,
      "reason": "Why they have this relationship"
    }
  ]
}

Trait values: 0.0-1.0
emotionalImpact: -1.0 (traumatic) to +1.0 (joyful)
importance: 1-10 (how much this shapes character)
relationshipScore: -1.0 (enemies) to +1.0 (best friends)`,
        },
        {
          role: 'user',
          content: `Chapter ${chapter.chapterNumber}: "${chapter.title}"

${chapter.content}

${chapter.choices.length > 0 ? `Winning choice: "${chapter.choices[0].text}"` : ''}

Extract all characters that appear in this chapter.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const extraction = JSON.parse(
      response.choices[0].message.content || '{}'
    ) as CharacterExtraction;

    // Save characters to database
    const savedCharacters = new Map<string, string>(); // name -> id

    for (const char of extraction.characters) {
      // Upsert character
      const character = await prisma.character.upsert({
        where: {
          storyId_name: {
            storyId: chapter.storyId,
            name: char.name,
          },
        },
        update: {
          description: char.description,
          traits: char.traits,
          lastAppearance: chapter.chapterNumber,
          totalAppearances: {
            increment: 1,
          },
        },
        create: {
          storyId: chapter.storyId,
          name: char.name,
          description: char.description,
          traits: char.traits,
          firstAppearance: chapter.chapterNumber,
          lastAppearance: chapter.chapterNumber,
          totalAppearances: 1,
        },
      });

      savedCharacters.set(char.name, character.id);

      // Save memories
      for (const memory of char.memories) {
        await prisma.characterMemory.create({
          data: {
            characterId: character.id,
            chapterId: chapter.id,
            choiceId: chapter.choices.length > 0 ? chapter.choices[0].id : null,
            eventType: memory.type,
            description: memory.event,
            emotionalImpact: memory.emotionalImpact,
            importance: memory.importance,
          },
        });
      }
    }

    // Save relationships
    for (const rel of extraction.relationships) {
      const charAId = savedCharacters.get(rel.characterA);
      const charBId = savedCharacters.get(rel.characterB);

      if (!charAId || !charBId) continue;

      // Ensure charAId < charBId for unique constraint
      const [aId, bId] = charAId < charBId ? [charAId, charBId] : [charBId, charAId];

      await prisma.characterRelationship.upsert({
        where: {
          characterAId_characterBId: {
            characterAId: aId,
            characterBId: bId,
          },
        },
        update: {
          score: rel.score,
          relationshipType: rel.type,
          history: {
            push: {
              chapter: chapter.chapterNumber,
              event: rel.reason,
              delta: 0, // Would calculate delta if updating
            },
          },
        },
        create: {
          characterAId: aId,
          characterBId: bId,
          score: rel.score,
          relationshipType: rel.type,
          history: [
            {
              chapter: chapter.chapterNumber,
              event: rel.reason,
              delta: rel.score,
            },
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      charactersExtracted: extraction.characters.length,
      relationshipsExtracted: extraction.relationships.length,
    });
  } catch (error) {
    logger.error('Error extracting characters:', error);
    return NextResponse.json(
      { error: 'Failed to extract characters' },
      { status: 500 }
    );
  }
}
