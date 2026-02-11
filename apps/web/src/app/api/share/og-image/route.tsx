import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { prisma } from '@voidborne/database'

/**
 * GET /api/share/og-image
 * 
 * Generate dynamic OG images for social sharing
 * 
 * Query params:
 * - type: bet | story | profile | leaderboard
 * - id: Entity ID (betId, storyId, userId, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'bet'
    const id = searchParams.get('id')

    if (!id) {
      return new Response('Missing id parameter', { status: 400 })
    }

    let imageData: any

    switch (type) {
      case 'bet':
        imageData = await generateBetCard(id)
        break
      case 'story':
        imageData = await generateStoryCard(id)
        break
      case 'profile':
        imageData = await generateProfileCard(id)
        break
      case 'leaderboard':
        imageData = await generateLeaderboardCard(id)
        break
      default:
        return new Response('Invalid type', { status: 400 })
    }

    if (!imageData) {
      return new Response('Entity not found', { status: 404 })
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0f',
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(212, 175, 55, 0.03) 0%, transparent 50%)',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.03,
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(212,175,55,0.1) 35px, rgba(212,175,55,0.1) 70px)',
            }}
          />

          {/* Content based on type */}
          {type === 'bet' && <BetCardContent {...imageData} />}
          {type === 'story' && <StoryCardContent {...imageData} />}
          {type === 'profile' && <ProfileCardContent {...imageData} />}
          {type === 'leaderboard' && <LeaderboardCardContent {...imageData} />}

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'rgba(212, 175, 55, 0.7)',
              fontSize: 24,
            }}
          >
            <span style={{ fontWeight: 600 }}>VOIDBORNE</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ opacity: 0.7 }}>Where predictions meet profit</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

// ============================================================================
// CARD COMPONENTS
// ============================================================================

function BetCardContent(props: {
  username: string
  amount: string
  choice: string
  story: string
  chapter: number
  odds: number
  isWinner?: boolean
  payout?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: 60,
        border: '2px solid rgba(212, 175, 55, 0.3)',
        borderRadius: 24,
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* User */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: 32,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(10,10,15,0.8))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: '#d4af37',
          }}
        >
          {props.username[0].toUpperCase()}
        </div>
        <span style={{ fontWeight: 600 }}>{props.username}</span>
      </div>

      {/* Bet Amount */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 28 }}>
          {props.isWinner ? '🎉 WON' : 'PLACED BET'}
        </div>
        <div
          style={{
            color: props.isWinner ? '#10b981' : '#d4af37',
            fontSize: 72,
            fontWeight: 700,
          }}
        >
          ${props.isWinner ? props.payout : props.amount}
        </div>
        {props.isWinner && (
          <div style={{ color: '#10b981', fontSize: 24 }}>
            +${(parseFloat(props.payout!) - parseFloat(props.amount)).toFixed(2)} profit
          </div>
        )}
      </div>

      {/* Choice */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 24,
          background: 'rgba(212, 175, 55, 0.1)',
          borderRadius: 16,
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 20 }}>ON</div>
        <div
          style={{
            color: '#d4af37',
            fontSize: 32,
            fontWeight: 600,
            maxWidth: 600,
            textAlign: 'center',
          }}
        >
          "{props.choice}"
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 20 }}>
          {props.story} • Chapter {props.chapter}
        </div>
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          {props.odds.toFixed(2)}x odds
        </div>
      </div>
    </div>
  )
}

function StoryCardContent(props: {
  title: string
  description: string
  genre: string
  currentChapter: number
  totalBets: string
  totalReaders: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: 60,
        textAlign: 'center',
        maxWidth: 900,
      }}
    >
      <div
        style={{
          color: '#d4af37',
          fontSize: 24,
          textTransform: 'uppercase',
          letterSpacing: 4,
        }}
      >
        {props.genre}
      </div>

      <div
        style={{
          color: '#fff',
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {props.title}
      </div>

      <div
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 28,
          lineHeight: 1.5,
          maxWidth: 700,
        }}
      >
        {props.description}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 48,
          marginTop: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 20 }}>
            Chapter
          </div>
          <div style={{ color: '#d4af37', fontSize: 48, fontWeight: 700 }}>
            {props.currentChapter}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 20 }}>
            Pool
          </div>
          <div style={{ color: '#d4af37', fontSize: 48, fontWeight: 700 }}>
            ${parseFloat(props.totalBets).toFixed(0)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 20 }}>
            Readers
          </div>
          <div style={{ color: '#d4af37', fontSize: 48, fontWeight: 700 }}>
            {props.totalReaders}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileCardContent(props: {
  username: string
  totalBets: number
  winRate: number
  profit: string
  currentStreak: number
  badges: string[]
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: 60,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.5), rgba(10,10,15,0.8))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 80,
          fontWeight: 700,
          color: '#d4af37',
          border: '4px solid rgba(212, 175, 55, 0.5)',
        }}
      >
        {props.username[0].toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ color: '#fff', fontSize: 56, fontWeight: 700 }}>
        {props.username}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 60, marginTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 24 }}>
            Win Rate
          </div>
          <div
            style={{
              color: props.winRate >= 50 ? '#10b981' : '#d4af37',
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            {props.winRate.toFixed(1)}%
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 24 }}>
            Profit
          </div>
          <div
            style={{
              color: parseFloat(props.profit) >= 0 ? '#10b981' : '#ef4444',
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            ${parseFloat(props.profit).toFixed(2)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 24 }}>
            Streak
          </div>
          <div style={{ color: '#d4af37', fontSize: 48, fontWeight: 700 }}>
            {props.currentStreak} 🔥
          </div>
        </div>
      </div>

      {/* Badges */}
      {props.badges.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          {props.badges.slice(0, 5).map((badge, i) => (
            <div
              key={i}
              style={{
                fontSize: 48,
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LeaderboardCardContent(props: {
  rank: number
  username: string
  category: string
  value: string
  label: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: 60,
      }}
    >
      {/* Rank */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          color: props.rank === 1 ? '#fbbf24' : props.rank === 2 ? '#9ca3af' : '#d97706',
          fontSize: 80,
          fontWeight: 700,
        }}
      >
        {props.rank === 1 && '👑'}
        {props.rank === 2 && '⭐'}
        {props.rank === 3 && '⭐'}
        <span>#{props.rank}</span>
      </div>

      {/* Category */}
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 32,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {props.category}
      </div>

      {/* Username */}
      <div style={{ color: '#fff', fontSize: 56, fontWeight: 700 }}>
        {props.username}
      </div>

      {/* Value */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 32,
          background: 'rgba(212, 175, 55, 0.1)',
          borderRadius: 16,
          border: '2px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 24 }}>
          {props.label}
        </div>
        <div style={{ color: '#d4af37', fontSize: 64, fontWeight: 700 }}>
          {props.value}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

async function generateBetCard(betId: string) {
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: {
      user: true,
      choice: {
        include: {
          chapter: {
            include: {
              story: true,
            },
          },
        },
      },
    },
  })

  if (!bet) return null

  return {
    username: bet.user.username || `${bet.user.walletAddress.slice(0, 6)}...${bet.user.walletAddress.slice(-4)}`,
    amount: bet.amount.toString(),
    choice: bet.choice.text,
    story: bet.choice.chapter.story.title,
    chapter: bet.choice.chapter.chapterNumber,
    odds: bet.odds || 2.0,
    isWinner: bet.isWinner,
    payout: bet.payout?.toString(),
  }
}

async function generateStoryCard(storyId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
  })

  if (!story) return null

  return {
    title: story.title,
    description: story.description,
    genre: story.genre,
    currentChapter: story.currentChapter,
    totalBets: story.totalBets.toString(),
    totalReaders: story.totalReaders,
  }
}

async function generateProfileCard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: {
        include: {
          badge: true,
        },
      },
    },
  })

  if (!user) return null

  const profit = user.totalWon.sub(user.totalLost)

  return {
    username: user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
    totalBets: user.totalBets,
    winRate: user.winRate,
    profit: profit.toString(),
    currentStreak: user.currentStreak,
    badges: user.badges.map((ub) => ub.badge.icon),
  }
}

async function generateLeaderboardCard(rankData: string) {
  // rankData format: "category:rank:userId"
  const [category, rank, userId] = rankData.split(':')

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return null

  const profit = user.totalWon.sub(user.totalLost)

  let label = ''
  let value = ''

  switch (category) {
    case 'winners':
      label = 'Net Profit'
      value = `$${profit.toString()}`
      break
    case 'predictors':
      label = 'Win Rate'
      value = `${user.winRate.toFixed(1)}%`
      break
    case 'streaks':
      label = 'Current Streak'
      value = `${user.currentStreak} 🔥`
      break
  }

  return {
    rank: parseInt(rank),
    username: user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
    category: category.toUpperCase(),
    value,
    label,
  }
}
