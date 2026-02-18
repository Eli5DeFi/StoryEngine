import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

/**
 * GET /api/prophecies
 * List all prophecies across all chapters.
 * Supports ?status=PENDING|FULFILLED|ECHOED|UNFULFILLED
 * Supports ?limit=20&offset=0
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const [prophecies, total] = await Promise.all([
      prisma.prophecy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          chapter: {
            select: {
              id: true,
              chapterNumber: true,
              title: true,
              storyId: true,
              story: { select: { id: true, title: true } },
            },
          },
          _count: { select: { mints: true } },
        },
      }),
      prisma.prophecy.count({ where }),
    ])

    // Shape response — mask text if not revealed
    const shaped = prophecies.map((p) => ({
      ...p,
      text: p.revealed ? p.text : null,
      targetEvent: null, // never expose to client
      mintedCount: p._count.mints,
      spotsRemaining: p.maxSupply - p._count.mints,
    }))

    return NextResponse.json({ prophecies: shaped, total, limit, offset })
  } catch (err) {
    console.error('[GET /api/prophecies]', err)
    return NextResponse.json({ error: 'Failed to fetch prophecies' }, { status: 500 })
  }
}

/**
 * POST /api/prophecies
 * Seed new prophecies for a chapter (oracle/admin only).
 * Body: { chapterId, prophecies: [{ teaser, contentHash, pendingURI, targetEvent, relevanceScore, artTheme }] }
 */
export async function POST(request: Request) {
  try {
    // TODO: enforce oracle-only auth (API key / admin wallet check)
    const body = await request.json()
    const { chapterId, prophecies } = body

    if (!chapterId || !Array.isArray(prophecies) || prophecies.length === 0) {
      return NextResponse.json({ error: 'chapterId and prophecies[] required' }, { status: 400 })
    }

    if (prophecies.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 prophecies per chapter' }, { status: 400 })
    }

    // Verify chapter exists
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const created = await prisma.$transaction(
      prophecies.map((p: {
        teaser: string
        contentHash: string
        pendingURI: string
        targetEvent?: string
        relevanceScore?: number
        artTheme?: string
      }) =>
        prisma.prophecy.create({
          data: {
            chapterId,
            teaser: p.teaser,
            contentHash: p.contentHash,
            pendingURI: p.pendingURI,
            targetEvent: p.targetEvent,
            relevanceScore: p.relevanceScore,
            artTheme: p.artTheme,
            status: 'PENDING',
          },
        })
      )
    )

    return NextResponse.json({ created: created.length, prophecies: created }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/prophecies]', err)
    return NextResponse.json({ error: 'Failed to seed prophecies' }, { status: 500 })
  }
}
