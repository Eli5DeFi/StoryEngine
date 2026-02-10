import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

/**
 * GET /api/stories
 * List all active stories
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'
    const genre = searchParams.get('genre')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      status,
    }

    if (genre) {
      where.genre = genre
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
          _count: {
            select: {
              chapters: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.story.count({ where }),
    ])

    return NextResponse.json({
      stories,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stories
 * Create a new story
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, genre, authorId, coverImage } = body

    if (!title || !description || !genre || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const story = await prisma.story.create({
      data: {
        title,
        description,
        genre,
        authorId,
        coverImage,
        isAIGenerated: true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    })

    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    )
  }
}
