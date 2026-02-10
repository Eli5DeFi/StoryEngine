import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

/**
 * GET /api/stories/[storyId]
 * Get a single story with all chapters
 */
export async function GET(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const story = await prisma.story.findUnique({
      where: { id: params.storyId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        chapters: {
          orderBy: { chapterNumber: 'asc' },
          include: {
            choices: {
              orderBy: { choiceNumber: 'asc' },
              include: {
                _count: {
                  select: { bets: true },
                },
              },
            },
            bettingPool: {
              include: {
                _count: {
                  select: { bets: true },
                },
              },
            },
          },
        },
      },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.story.update({
      where: { id: params.storyId },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(story)
  } catch (error) {
    console.error('Error fetching story:', error)
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    )
  }
}
