import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@voidborne/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/cron/extract-characters
 * Background job to extract characters from recently published chapters
 * 
 * This should be called:
 * 1. After a chapter is published (webhook/event)
 * 2. As a periodic cron job (every hour) to catch any missed chapters
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find recently published chapters (last 24 hours) that haven't been processed
    const recentChapters = await prisma.chapter.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        story: true,
        choices: {
          where: { isChosen: true },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50, // Process up to 50 chapters at a time
    });

    logger.info(`Found ${recentChapters.length} recent chapters to process`);

    const results = {
      processed: 0,
      errors: 0,
      skipped: 0,
    };

    for (const chapter of recentChapters) {
      try {
        // Check if characters already extracted for this chapter
        const existingCharacters = await prisma.character.findMany({
          where: {
            storyId: chapter.storyId,
            firstAppearance: chapter.chapterNumber,
          },
        });

        if (existingCharacters.length > 0) {
          logger.debug(`Skipping chapter ${chapter.id} - characters already extracted`);
          results.skipped++;
          continue;
        }

        // Call the extract API internally
        const extractResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/characters/extract`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chapterId: chapter.id,
            }),
          }
        );

        if (!extractResponse.ok) {
          logger.error(`Failed to extract characters from chapter ${chapter.id}`);
          results.errors++;
          continue;
        }

        const extractResult = await extractResponse.json();
        logger.info(
          `Extracted ${extractResult.charactersExtracted} characters from chapter ${chapter.id}`
        );
        results.processed++;

        // Add small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error processing chapter ${chapter.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.processed} chapters, ${results.errors} errors, ${results.skipped} skipped`,
    });
  } catch (error) {
    logger.error('Error in character extraction cron:', error);
    return NextResponse.json(
      { error: 'Failed to run character extraction cron' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/extract-characters
 * Status check
 */
export async function GET(request: NextRequest) {
  try {
    // Count recent chapters
    const recentCount = await prisma.chapter.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Count total characters
    const totalCharacters = await prisma.character.count();

    return NextResponse.json({
      status: 'ok',
      recentChapters: recentCount,
      totalCharacters,
      message: 'Character extraction cron is ready',
    });
  } catch (error) {
    logger.error('Error checking cron status:', error);
    return NextResponse.json(
      { error: 'Failed to check cron status' },
      { status: 500 }
    );
  }
}
