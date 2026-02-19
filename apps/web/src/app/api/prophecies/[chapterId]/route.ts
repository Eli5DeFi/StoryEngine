import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/prophecies/[chapterId]
 * Get all prophecies for a specific chapter, with mint status.
 */
export async function GET(
  _request: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
    const { chapterId } = params

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        storyId: true,
        story: { select: { id: true, title: true } },
        prophecies: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: { select: { mints: true } },
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const shaped = chapter.prophecies.map((p) => ({
      id: p.id,
      chapterId: p.chapterId,
      teaser: p.teaser,
      contentHash: p.contentHash,
      pendingURI: p.pendingURI,
      fulfilledURI: p.fulfilledURI,
      echoedURI: p.echoedURI,
      unfulfilledURI: p.unfulfilledURI,
      status: p.status,
      revealed: p.revealed,
      revealedAt: p.revealedAt,
      // Only expose text after reveal
      text: p.revealed ? p.text : null,
      artTheme: p.artTheme,
      mintedCount: p._count.mints,
      maxSupply: p.maxSupply,
      spotsRemaining: p.maxSupply - p._count.mints,
      createdAt: p.createdAt,
      fulfilledAt: p.fulfilledAt,
    }))

    const summary = {
      total: shaped.length,
      totalMinted: shaped.reduce((s, p) => s + p.mintedCount, 0),
      fulfilled: shaped.filter((p) => p.status === 'FULFILLED').length,
      echoed: shaped.filter((p) => p.status === 'ECHOED').length,
      unfulfilled: shaped.filter((p) => p.status === 'UNFULFILLED').length,
      pending: shaped.filter((p) => p.status === 'PENDING').length,
    }

    return NextResponse.json({
      chapter: {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        storyId: chapter.storyId,
        story: chapter.story,
      },
      prophecies: shaped,
      summary,
    })
  } catch (err) {
    logger.error('[GET /api/prophecies/[chapterId]]', err)
    return NextResponse.json({ error: 'Failed to fetch chapter prophecies' }, { status: 500 })
  }
}

/**
 * PATCH /api/prophecies/[chapterId]
 * Fulfill chapter prophecies after resolution (oracle only).
 * Body: { outcomes: [{ prophecyId, status, metadataURI, explanation }], chapterSummary }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
    const body = await request.json()
    const { outcomes, chapterSummary } = body

    if (!Array.isArray(outcomes) || outcomes.length === 0) {
      return NextResponse.json({ error: 'outcomes[] required' }, { status: 400 })
    }

    // Update all prophecies in one transaction
    const updated = await prisma.$transaction(
      outcomes.map((o: {
        prophecyId: string
        status: 'FULFILLED' | 'ECHOED' | 'UNFULFILLED'
        metadataURI?: string
      }) =>
        prisma.prophecy.update({
          where: { id: o.prophecyId },
          data: {
            status: o.status,
            fulfilledAt: new Date(),
            ...(o.status === 'FULFILLED' ? { fulfilledURI: o.metadataURI } : {}),
            ...(o.status === 'ECHOED' ? { echoedURI: o.metadataURI } : {}),
            ...(o.status === 'UNFULFILLED' ? { unfulfilledURI: o.metadataURI } : {}),
          },
        })
      )
    )

    return NextResponse.json({
      updated: updated.length,
      chapterSummary,
    })
  } catch (err) {
    logger.error('[PATCH /api/prophecies/[chapterId]]', err)
    return NextResponse.json({ error: 'Failed to fulfill prophecies' }, { status: 500 })
  }
}
