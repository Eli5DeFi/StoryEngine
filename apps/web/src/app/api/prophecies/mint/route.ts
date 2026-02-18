import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

/**
 * POST /api/prophecies/mint
 * Mint a Prophecy NFT (or Oracle Pack of up to 20).
 *
 * Body (single):  { prophecyId, walletAddress }
 * Body (pack):    { prophecyIds: string[], walletAddress }
 *
 * Returns: { mints: ProphecyMint[], totalForgePaid }
 *
 * Note: This route handles the off-chain record. The actual on-chain ERC-721
 * mint is handled by the ProphecyNFT smart contract via wagmi on the frontend.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prophecyId, prophecyIds, walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 })
    }

    const ids: string[] = prophecyIds ?? (prophecyId ? [prophecyId] : [])
    if (ids.length === 0) {
      return NextResponse.json({ error: 'prophecyId or prophecyIds required' }, { status: 400 })
    }
    if (ids.length > 20) {
      return NextResponse.json({ error: 'Oracle Pack limited to 20 prophecies' }, { status: 400 })
    }

    // Resolve user from wallet
    let user = await prisma.user.findUnique({ where: { walletAddress } })
    if (!user) {
      // Auto-create user on first interaction
      user = await prisma.user.create({
        data: { walletAddress },
      })
    }

    const isPack = ids.length > 1
    // 10% discount for Oracle Pack
    const pricePerNFT = isPack ? 4.5 : 5.0

    // Process each prophecy
    const results = await prisma.$transaction(async (tx) => {
      const mints = []

      for (const pId of ids) {
        // Fetch prophecy with lock
        const prophecy = await tx.prophecy.findUnique({
          where: { id: pId },
          include: { _count: { select: { mints: true } } },
        })

        if (!prophecy) {
          throw new Error(`Prophecy ${pId} not found`)
        }
        if (prophecy.status !== 'PENDING') {
          throw new Error(`Prophecy ${pId} already resolved — cannot mint`)
        }
        if (prophecy._count.mints >= prophecy.maxSupply) {
          throw new Error(`Prophecy ${pId} is sold out (${prophecy.maxSupply}/${prophecy.maxSupply})`)
        }

        // Check for duplicate mint
        const existing = await tx.prophecyMint.findUnique({
          where: { prophecyId_userId: { prophecyId: pId, userId: user!.id } },
        })
        if (existing) {
          throw new Error(`Already minted prophecy ${pId}`)
        }

        const mintOrder = prophecy._count.mints + 1

        const mint = await tx.prophecyMint.create({
          data: {
            prophecyId: pId,
            userId: user!.id,
            walletAddress,
            mintOrder,
            forgePaid: pricePerNFT,
          },
          include: {
            prophecy: {
              select: {
                id: true,
                teaser: true,
                status: true,
                artTheme: true,
                pendingURI: true,
                mintedCount: true,
                maxSupply: true,
              },
            },
          },
        })

        mints.push(mint)
      }

      return mints
    })

    const totalForgePaid = results.reduce((sum, m) => sum + m.forgePaid, 0)

    return NextResponse.json(
      {
        success: true,
        mints: results,
        count: results.length,
        totalForgePaid,
        isPack,
        discount: isPack ? '10%' : null,
      },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mint failed'
    logger.error('[POST /api/prophecies/mint]', err)

    // User-friendly errors
    if (message.includes('sold out')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    if (message.includes('Already minted')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    if (message.includes('resolved')) {
      return NextResponse.json({ error: message }, { status: 422 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/prophecies/mint
 * Get all mints for a given wallet address.
 * ?wallet=0x...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
    })

    if (!user) {
      return NextResponse.json({ mints: [], total: 0 })
    }

    const mints = await prisma.prophecyMint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        prophecy: {
          include: {
            chapter: {
              select: {
                id: true,
                chapterNumber: true,
                title: true,
                story: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    })

    // Compute rarity for each mint
    const withRarity = mints.map((m) => ({
      ...m,
      rarity: computeRarity(m.prophecy.status, m.mintOrder),
      estimatedValue: computeEstimatedValue(m.prophecy.status, m.mintOrder, m.forgePaid),
    }))

    const stats = {
      total: mints.length,
      fulfilled: mints.filter((m) => m.prophecy.status === 'FULFILLED').length,
      echoed: mints.filter((m) => m.prophecy.status === 'ECHOED').length,
      unfulfilled: mints.filter((m) => m.prophecy.status === 'UNFULFILLED').length,
      pending: mints.filter((m) => m.prophecy.status === 'PENDING').length,
      totalForgePaid: mints.reduce((s, m) => s + m.forgePaid, 0),
      estimatedPortfolioValue: withRarity.reduce((s, m) => s + m.estimatedValue, 0),
    }

    return NextResponse.json({ mints: withRarity, stats })
  } catch (err) {
    logger.error('[GET /api/prophecies/mint]', err)
    return NextResponse.json({ error: 'Failed to fetch mints' }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeRarity(
  status: string,
  mintOrder: number
): 'MYTHIC' | 'LEGENDARY' | 'RARE' | 'UNCOMMON' | 'COMMON' {
  if (status === 'FULFILLED') return mintOrder <= 5 ? 'MYTHIC' : 'LEGENDARY'
  if (status === 'ECHOED') return mintOrder <= 10 ? 'RARE' : 'UNCOMMON'
  return 'COMMON'
}

function computeEstimatedValue(status: string, mintOrder: number, pricePaid: number): number {
  if (status === 'FULFILLED') return pricePaid * (mintOrder <= 5 ? 20 : 10)
  if (status === 'ECHOED') return pricePaid * (mintOrder <= 10 ? 4 : 3)
  return pricePaid // face value for unfulfilled
}
