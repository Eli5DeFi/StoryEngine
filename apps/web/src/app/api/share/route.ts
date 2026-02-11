import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * POST /api/share
 * Generate shareable link for a bet, win, or profile
 * 
 * Body:
 * {
 *   type: 'bet' | 'win' | 'streak' | 'profile',
 *   betId?: string,
 *   userId?: string,
 *   platform?: 'twitter' | 'farcaster' | 'telegram'
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, betId, userId, platform = 'twitter' } = body

    let shareData: any = {}

    // Fetch bet details if betId provided
    if (betId) {
      const bet = await prisma.bet.findUnique({
        where: { id: betId },
        include: {
          choice: {
            include: {
              chapter: {
                include: {
                  story: true,
                },
              },
            },
          },
          user: {
            include: {
              badges: {
                include: { badge: true },
              },
            },
          },
        },
      })

      if (!bet) {
        return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
      }

      shareData = {
        storyTitle: bet.choice.chapter.story.title,
        choice: bet.choice.text,
        amount: parseFloat(bet.amount.toString()),
        potentialWin: bet.payout ? parseFloat(bet.payout.toString()) : 0,
        username: bet.user.username || formatAddress(bet.user.walletAddress),
        streak: bet.user.currentStreak,
        badges: bet.user.badges
          .slice(0, 3)
          .map(ub => ub.badge.icon)
          .join(''),
      }
    }

    // Fetch user details if userId provided
    if (userId && !betId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          badges: {
            include: { badge: true },
            orderBy: { earnedAt: 'desc' },
          },
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      shareData = {
        username: user.username || formatAddress(user.walletAddress),
        streak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalBets: user.totalBets,
        winRate: user.winRate,
        badges: user.badges
          .slice(0, 5)
          .map(ub => ub.badge.icon)
          .join(''),
      }
    }

    // Generate OG image URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const ogImageUrl = new URL(`${baseUrl}/api/share/og`)
    ogImageUrl.searchParams.set('type', type)
    Object.entries(shareData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        ogImageUrl.searchParams.set(key, String(value))
      }
    })

    // Generate share text based on type
    let shareText = ''
    switch (type) {
      case 'bet':
        shareText = `I just bet $${shareData.amount} on "${shareData.choice}" in ${shareData.storyTitle}! 🎯\n\nThink you can predict better? Join me on Voidborne!`
        break
      case 'win':
        shareText = `💰 I WON $${shareData.potentialWin} on Voidborne!\n\nStory: ${shareData.storyTitle}\nChoice: ${shareData.choice}\n\nBet on AI stories and win big!`
        break
      case 'streak':
        shareText = `🔥 ${shareData.streak} WIN STREAK on Voidborne!\n\nI'm on fire predicting AI story choices. Can you beat my streak?`
        break
      case 'profile':
        shareText = `📊 My Voidborne Stats:\n${shareData.badges}\n\n${shareData.totalBets} bets | ${shareData.winRate.toFixed(1)}% win rate | ${shareData.longestStreak} longest streak\n\nJoin me and predict AI story outcomes!`
        break
    }

    // Generate share URLs for different platforms
    const shareUrl = `${baseUrl}/story/${betId ? bet!.choice.chapter.storyId : ''}`
    
    const shareUrls = {
      twitter: generateTwitterUrl(shareText, shareUrl),
      farcaster: generateFarcasterUrl(shareText, shareUrl),
      telegram: generateTelegramUrl(shareText, shareUrl),
    }

    return NextResponse.json({
      shareText,
      shareUrl,
      shareUrls,
      ogImageUrl: ogImageUrl.toString(),
      data: shareData,
    })
  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

function formatAddress(address: string | null): string {
  if (!address) return 'Anonymous'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function generateTwitterUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text,
    url,
    hashtags: 'Voidborne,AIStories,PredictionMarket',
  })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

function generateFarcasterUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text: `${text}\n\n${url}`,
  })
  return `https://warpcast.com/~/compose?${params.toString()}`
}

function generateTelegramUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    url,
    text,
  })
  return `https://t.me/share/url?${params.toString()}`
}
