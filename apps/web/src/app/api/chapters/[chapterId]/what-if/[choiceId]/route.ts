import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@voidborne/database';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/chapters/[chapterId]/what-if/[choiceId]
 * Generate or return cached alternate outcome for a choice that didn't win
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string; choiceId: string } }
) {
  try {
    const { chapterId, choiceId } = params;

    // Check if we already have a cached result
    const cached = await prisma.alternateOutcome.findUnique({
      where: {
        chapterId_choiceId: {
          chapterId,
          choiceId,
        },
      },
    });

    if (cached && cached.generated) {
      // Increment view count
      await prisma.alternateOutcome.update({
        where: { id: cached.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        preview: cached.preview,
        fullContent: cached.fullContent,
        aiModel: cached.aiModel,
        generatedAt: cached.createdAt,
        cached: true,
        viewCount: cached.viewCount + 1,
      });
    }

    // Generate new what-if scenario
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        choices: true,
        story: true,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const alternateChoice = chapter.choices.find((c) => c.id === choiceId);
    const winningChoice = chapter.choices.find((c) => c.isChosen);

    if (!alternateChoice) {
      return NextResponse.json(
        { error: 'Choice not found' },
        { status: 404 }
      );
    }

    if (alternateChoice.isChosen) {
      return NextResponse.json(
        { error: 'This choice already won - no alternate outcome needed' },
        { status: 400 }
      );
    }

    // Generate what-if scenario using Claude Sonnet
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Story: "${chapter.story.title}"
Chapter ${chapter.chapterNumber}: "${chapter.title}"

${chapter.content}

The winning choice was: "${winningChoice?.text || 'Unknown'}"

Generate a 200-word preview of what would have happened if this choice had won instead:
"${alternateChoice.text}"

Keep the same characters and setting, but show how this decision would have changed the immediate outcome. Make it compelling and show meaningful consequences of this alternate choice.`,
        },
      ],
    });

    const preview = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save to database
    const outcome = await prisma.alternateOutcome.upsert({
      where: {
        chapterId_choiceId: {
          chapterId,
          choiceId,
        },
      },
      update: {
        preview,
        aiModel: 'claude-sonnet-4',
        generated: true,
        viewCount: 1,
      },
      create: {
        chapterId,
        choiceId,
        preview,
        aiModel: 'claude-sonnet-4',
        generated: true,
        viewCount: 1,
      },
    });

    return NextResponse.json({
      preview: outcome.preview,
      fullContent: outcome.fullContent,
      aiModel: outcome.aiModel,
      generatedAt: outcome.createdAt,
      cached: false,
      viewCount: outcome.viewCount,
    });
  } catch (error) {
    console.error('Error generating what-if scenario:', error);
    return NextResponse.json(
      { error: 'Failed to generate what-if scenario' },
      { status: 500 }
    );
  }
}
