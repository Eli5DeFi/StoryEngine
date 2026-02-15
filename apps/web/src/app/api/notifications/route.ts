import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

/**
 * GET /api/notifications
 * Get notifications for a user
 * 
 * Query params:
 * - walletAddress: string (required)
 * - unreadOnly: boolean (optional, default: false)
 * - limit: number (optional, default: 50)
 * - offset: number (optional, default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const walletAddress = searchParams.get('walletAddress')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where: any = { userId: user.id }
    if (unreadOnly) {
      where.isRead = false
    }

    // Get notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 * 
 * Body:
 * - walletAddress: string (required)
 * - type: NotificationType (required)
 * - title: string (required)
 * - message: string (required)
 * - link?: string (optional)
 * - metadata?: object (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, type, title, message, link, metadata } = body

    if (!walletAddress || !type || !title || !message) {
      return NextResponse.json(
        { error: 'walletAddress, type, title, and message are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type,
        title,
        message,
        link,
        metadata,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 * 
 * Body:
 * - notificationIds: string[] (required)
 * - isRead: boolean (required)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, isRead } = body

    if (!notificationIds || typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'notificationIds and isRead are required' },
        { status: 400 }
      )
    }

    // Update notifications
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    })

    return NextResponse.json({
      updated: result.count,
    })
  } catch (error) {
    console.error('Failed to update notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications
 * 
 * Body:
 * - notificationIds: string[] (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400 }
      )
    }

    // Delete notifications
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
      },
    })

    return NextResponse.json({
      deleted: result.count,
    })
  } catch (error) {
    console.error('Failed to delete notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
