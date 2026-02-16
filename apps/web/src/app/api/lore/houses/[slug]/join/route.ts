import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

export const dynamic = 'force-dynamic'

/**
 * POST /api/lore/houses/[slug]/join
 * Allow a user to join a house
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()
    const { userId, isPrimary } = body

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID required',
        },
        { status: 400 }
      )
    }

    // Check if house exists
    const house = await prisma.house.findUnique({
      where: { slug },
    })

    if (!house) {
      return NextResponse.json(
        {
          success: false,
          error: 'House not found',
        },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMembership = await prisma.userHouse.findUnique({
      where: {
        userId_houseId: {
          userId,
          houseId: house.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already a member of this house',
        },
        { status: 400 }
      )
    }

    // If setting as primary, remove primary from other houses
    if (isPrimary) {
      await prisma.userHouse.updateMany({
        where: {
          userId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    // Create membership
    const userHouse = await prisma.userHouse.create({
      data: {
        userId,
        houseId: house.id,
        isPrimary: isPrimary || false,
        reputation: 0,
        rank: 'Initiate',
        level: 1,
        experience: 0,
        totalBets: 0,
        totalWins: 0,
        protocolsLearned: [],
        badges: [],
      },
      include: {
        house: true,
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    })

    // Increment house member count
    await prisma.house.update({
      where: { id: house.id },
      data: {
        totalMembers: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: userHouse,
      message: `Successfully joined ${house.name}!`,
    })
  } catch (error) {
    console.error('Error joining house:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to join house',
      },
      { status: 500 }
    )
  }
}
