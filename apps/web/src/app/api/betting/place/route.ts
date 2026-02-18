import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

/**
 * POST /api/betting/place
 * Place a bet on a choice.
 *
 * Accepts either `walletAddress` (from the frontend ConnectWallet flow) or
 * `userId` (direct API callers). When `walletAddress` is provided the user
 * record is upserted so new wallets are automatically registered.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { poolId, choiceId, walletAddress, userId: rawUserId, amount, txHash } = body

    // Validate required fields — accept walletAddress OR userId
    if (!poolId || !choiceId || (!walletAddress && !rawUserId) || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields (poolId, choiceId, walletAddress, amount)' },
        { status: 400 }
      )
    }

    // Resolve userId: prefer walletAddress lookup (upsert) so new wallets auto-register
    let userId = rawUserId as string | undefined
    if (walletAddress && !userId) {
      const user = await prisma.user.upsert({
        where: { walletAddress: walletAddress.toLowerCase() },
        create: { walletAddress: walletAddress.toLowerCase() },
        update: {},
        select: { id: true },
      })
      userId = user.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve user' }, { status: 400 })
    }

    // Get betting pool and verify it's open
    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        chapter: {
          include: {
            choices: true,
          },
        },
      },
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Betting pool not found' },
        { status: 404 }
      )
    }

    if (pool.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Betting pool is not open' },
        { status: 400 }
      )
    }

    // Check if pool has closed
    if (new Date() >= pool.closesAt) {
      return NextResponse.json(
        { error: 'Betting pool has closed' },
        { status: 400 }
      )
    }

    // Verify choice belongs to this pool
    const choice = pool.chapter.choices.find((c) => c.id === choiceId)
    if (!choice) {
      return NextResponse.json(
        { error: 'Choice not found in this pool' },
        { status: 404 }
      )
    }

    // Verify amount is within limits
    const betAmount = Number(amount)
    if (betAmount < pool.minBet.toNumber()) {
      return NextResponse.json(
        { error: `Minimum bet is ${pool.minBet} FORGE` },
        { status: 400 }
      )
    }

    if (pool.maxBet && betAmount > pool.maxBet.toNumber()) {
      return NextResponse.json(
        { error: `Maximum bet is ${pool.maxBet} FORGE` },
        { status: 400 }
      )
    }

    // Calculate current odds before bet
    const currentOdds = pool.totalPool.toNumber() > 0
      ? pool.totalPool.toNumber() / (choice.totalBets.toNumber() + betAmount)
      : 0

    // Create bet in a transaction
    const bet = await prisma.$transaction(async (tx) => {
      // Create the bet
      const newBet = await tx.bet.create({
        data: {
          userId,
          poolId,
          choiceId,
          amount: betAmount,
          odds: currentOdds,
          txHash,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
          choice: {
            select: {
              id: true,
              choiceNumber: true,
              text: true,
            },
          },
        },
      })

      // Update choice totals
      await tx.choice.update({
        where: { id: choiceId },
        data: {
          totalBets: { increment: betAmount },
          betCount: { increment: 1 },
        },
      })

      // Update pool totals
      await tx.bettingPool.update({
        where: { id: poolId },
        data: {
          totalPool: { increment: betAmount },
          totalBets: { increment: 1 },
        },
      })

      // Update user stats
      await tx.user.update({
        where: { id: userId },
        data: {
          totalBets: { increment: 1 },
        },
      })

      return newBet
    })

    return NextResponse.json(bet, { status: 201 })
  } catch (error) {
    logger.error('Error placing bet:', error)
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    )
  }
}
