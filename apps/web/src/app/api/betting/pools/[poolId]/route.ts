import { NextResponse } from 'next/server'
import { prisma, calculateOdds } from '@voidborne/database'

/**
 * GET /api/betting/pools/[poolId]
 * Get betting pool details with current odds
 */
export async function GET(
  request: Request,
  { params }: { params: { poolId: string } }
) {
  try {
    const pool = await prisma.bettingPool.findUnique({
      where: { id: params.poolId },
      include: {
        chapter: {
          include: {
            story: {
              select: {
                id: true,
                title: true,
              },
            },
            choices: {
              orderBy: { choiceNumber: 'asc' },
              select: {
                id: true,
                choiceNumber: true,
                text: true,
                description: true,
                totalBets: true,
                betCount: true,
                isChosen: true,
              },
            },
          },
        },
        _count: {
          select: { bets: true },
        },
      },
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Betting pool not found' },
        { status: 404 }
      )
    }

    // Calculate current odds for each choice
    const choicesWithOdds = pool.chapter.choices.map((choice) => ({
      ...choice,
      odds: calculateOdds(
        Number(choice.totalBets),
        Number(pool.totalPool)
      ),
      percentage: pool.totalPool.toNumber() > 0
        ? (choice.totalBets.toNumber() / pool.totalPool.toNumber()) * 100
        : 0,
    }))

    return NextResponse.json({
      ...pool,
      chapter: {
        ...pool.chapter,
        choices: choicesWithOdds,
      },
    })
  } catch (error) {
    console.error('Error fetching betting pool:', error)
    return NextResponse.json(
      { error: 'Failed to fetch betting pool' },
      { status: 500 }
    )
  }
}
