import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export const runtime = 'edge'

/**
 * GET /api/share/og
 * Generate OG image for social sharing
 * 
 * Query params:
 * - type: 'bet' | 'win' | 'streak' | 'profile'
 * - storyTitle: string
 * - choice: string
 * - amount: number
 * - potentialWin: number
 * - username: string
 * - streak: number
 * - badges: string (comma-separated emojis)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || 'bet'
    const storyTitle = searchParams.get('storyTitle') || 'Voidborne Story'
    const choice = searchParams.get('choice') || 'Choice A'
    const amount = searchParams.get('amount') || '100'
    const potentialWin = searchParams.get('potentialWin') || '200'
    const username = searchParams.get('username') || 'Anonymous'
    const streak = searchParams.get('streak') || '0'
    const badges = searchParams.get('badges') || ''

    // Voidborne brand colors
    const colors = {
      void: '#0a0a0f',
      gold: '#d4af37',
      teal: '#06b6d4',
      purple: '#9333ea',
      border: 'rgba(212, 175, 55, 0.2)',
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
            backgroundColor: colors.void,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)
            `,
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Border */}
          <div
            style={{
              position: 'absolute',
              inset: '30px',
              border: `2px solid ${colors.border}`,
              borderRadius: '20px',
            }}
          />

          {/* Logo/Brand */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '32px' }}>🌌</span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: colors.gold,
                letterSpacing: '2px',
              }}
            >
              VOIDBORNE
            </span>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '30px',
              maxWidth: '900px',
            }}
          >
            {/* Story Title */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: colors.gold,
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: '800px',
                textShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
              }}
            >
              {storyTitle}
            </div>

            {/* Divider */}
            <div
              style={{
                width: '200px',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${colors.gold}, transparent)`,
              }}
            />

            {/* Choice/Bet Info */}
            {type === 'bet' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  backgroundColor: 'rgba(212, 175, 55, 0.05)',
                  padding: '40px 60px',
                  borderRadius: '16px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  I bet on:
                </div>
                <div
                  style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: colors.teal,
                    textAlign: 'center',
                  }}
                >
                  {choice}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '40px',
                    marginTop: '10px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Wagered
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.gold }}>
                      ${amount}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px', color: 'rgba(255, 255, 255, 0.3)' }}>→</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      To Win
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                      ${potentialWin}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Win Announcement */}
            {type === 'win' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <div style={{ fontSize: '80px' }}>🏆</div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#10b981',
                  }}
                >
                  I WON ${potentialWin}!
                </div>
              </div>
            )}

            {/* Streak */}
            {type === 'streak' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <div style={{ fontSize: '64px' }}>🔥</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: colors.gold }}>
                    {streak} Win Streak!
                  </div>
                  <div style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    by {username}
                  </div>
                </div>
              </div>
            )}

            {/* User Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {username}
              </div>
              {badges && (
                <>
                  <div
                    style={{
                      width: '2px',
                      height: '20px',
                      backgroundColor: colors.border,
                    }}
                  />
                  <div style={{ fontSize: '24px' }}>{badges}</div>
                </>
              )}
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              position: 'absolute',
              bottom: '50px',
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            voidborne.xyz • Bet on AI Stories
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    logger.error('OG image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
