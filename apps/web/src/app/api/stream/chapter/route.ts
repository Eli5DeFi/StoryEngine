/**
 * Voidborne Innovation Cycle #51 — Live Narrative Broadcast API
 * Route: GET /api/stream/chapter
 *
 * Server-Sent Events endpoint for live chapter streaming.
 * Clients subscribe and receive real-time text deltas, betting window
 * events, odds updates, revelations, and payouts.
 *
 * Usage:
 *   const es = new EventSource('/api/stream/chapter?broadcastId=...&address=0x...')
 *   es.onmessage = (e) => { const event = JSON.parse(e.data) }
 */

import { NextRequest } from 'next/server'

// In production, import the actual engine
// import { LiveNarrativeBroadcast } from '@narrative-forge/agent-sdk'

// ─── Mock Broadcast Engine for API Demo ──────────────────────────────────────

interface BroadcastState {
  broadcastId: string
  chapterId: string
  status: 'live' | 'window_open' | 'revelation' | 'settling' | 'complete'
  viewerCount: number
  textBuffer: string
  activeWindowId?: string
}

// In-memory store (use Redis in production for multi-instance)
const activeBroadcasts = new Map<string, BroadcastState>()

function getMockBroadcastState(broadcastId: string): BroadcastState {
  if (!activeBroadcasts.has(broadcastId)) {
    activeBroadcasts.set(broadcastId, {
      broadcastId,
      chapterId: 'chapter_28',
      status: 'live',
      viewerCount: 0,
      textBuffer: '',
    })
  }
  return activeBroadcasts.get(broadcastId)!
}

// ─── Mock Chapter Story Content ───────────────────────────────────────────────

const CHAPTER_STORY_SEGMENTS = [
  'The Grand Conclave chamber hummed with the low vibration of suppressed panic. ',
  'Five hundred years of political tradition had never seen what was unfolding before the assembled delegates — ',
  'the heir to House Valdris, standing alone at the center dais, holding a data crystal that could unmake everything. ',
  '\n\n',
  'House Obsidian\'s Speaker rose from the obsidian-black seating block. ',
  '"Three days," he said, his voice carrying the weight of threat. ',
  '"Three days we have waited for House Valdris to honor their obligation. ',
  'The Void Stitching continues. The threads of reality fray. ',
  'We cannot wait while your heir deliberates." ',
  '\n\n',
  'She felt the weight of all five Houses bearing down on her — ',
  'Meridian\'s cold neutrality, Auric\'s barely-concealed excitement, Zephyr\'s nervous energy — ',
  'but it was Obsidian\'s Speaker who held her gaze. ',
  'He knew, she realized. He had always known. ',
  '\n\n',
  'The crystal pulsed cold in her grip. ',
  'The name encoded within it would shatter this chamber\'s fragile peace. ',
  'But silence would shatter something else — something more fundamental. ',
  '\n\n',
  'She stepped forward. The chamber held its breath— ',
]

const REVELATION_SEGMENTS = {
  EXPOSE: [
    '\n\n',
    'She raised the crystal above her head and spoke three words: ',
    '"Witness. Remember. Judge." ',
    '\n\n',
    'The holographic projector ignited, and House Obsidian\'s true face burned across every screen in the chamber. ',
    'The Speaker\'s composure fractured for precisely one second — one second of pure, unmasked terror — ',
    'before the chamber erupted. ',
    '\n\n',
    'House Valdris had exposed the Void Stitchers. The cost was unknown. The die was cast. ',
    'History would remember this moment as the beginning of the War of Unraveling — ',
    'or the moment that stopped it. Nobody yet knew which. ',
  ],
  CONCEAL: [
    '\n\n',
    'She pocketed the crystal. Smooth. Invisible. The motion of someone who had made this choice a thousand times in her mind. ',
    '\n\n',
    '"House Valdris has conducted a full investigation," she said. ',
    '"The Void Stitching originates from outside our galactic arm. ',
    'We are pursuing diplomatic channels with the Boundary Stations." ',
    '\n\n',
    'It was a lie. Elegant and complete. ',
    'The Speaker\'s eyes narrowed for precisely the length of a breath — he knew, and she knew he knew — ',
    'but he sat down. ',
    '\n\n',
    'She had bought time. The Conclave would reconvene in thirty days. ',
    'She needed twenty. ',
  ],
}

// ─── SSE Stream Generator ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const broadcastId = searchParams.get('broadcastId')
  const viewerAddress = searchParams.get('address')
  const chapterId = searchParams.get('chapterId') ?? 'chapter_28'

  if (!broadcastId) {
    return new Response('broadcastId required', { status: 400 })
  }

  const broadcast = getMockBroadcastState(broadcastId)
  if (viewerAddress) broadcast.viewerCount++

  const encoder = new TextEncoder()

  function sendEvent(type: string, payload: unknown): Uint8Array {
    const data = JSON.stringify({
      type,
      payload,
      timestamp: Date.now(),
      broadcastId,
    })
    return encoder.encode(`data: ${data}\n\n`)
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Initial broadcast_start event
        controller.enqueue(sendEvent('broadcast_start', {
          broadcastId,
          chapterId,
          viewerCount: broadcast.viewerCount,
          choices: [
            { label: 'Expose', description: 'Shatter the crystal and reveal the Void Stitcher identity publicly' },
            { label: 'Conceal', description: 'Pocket the crystal and deflect with a false lead' },
          ],
          estimatedDuration: 180_000,  // 3 minutes
        }))

        // Stream the story content word by word
        for (let i = 0; i < CHAPTER_STORY_SEGMENTS.length; i++) {
          const segment = CHAPTER_STORY_SEGMENTS[i]

          controller.enqueue(sendEvent('text_delta', {
            content: segment,
            chunkIndex: i,
          }))

          broadcast.textBuffer += segment

          // Delay between segments (simulates real AI streaming)
          await new Promise(r => setTimeout(r, 150 + Math.random() * 100))

          // Open betting window after "She stepped forward. The chamber held its breath—"
          if (i === CHAPTER_STORY_SEGMENTS.length - 1) {
            broadcast.status = 'window_open'
            const windowId = `window_${broadcastId}_${Date.now()}`
            broadcast.activeWindowId = windowId

            controller.enqueue(sendEvent('betting_window_open', {
              windowId,
              chapterId,
              openedAt: Date.now(),
              closesAt: Date.now() + 30_000,  // 30s for demo (60s in production)
              timeRemaining: 30,
              choiceA: { label: 'Expose', description: 'Reveal the Stitcher publicly' },
              choiceB: { label: 'Conceal', description: 'Hide the truth, buy time' },
              oddsA: 0.52,
              oddsB: 0.48,
              poolA: '12400000000',   // 12,400 USDC (string for BigInt compat)
              poolB: '11600000000',   // 11,600 USDC
              totalPool: '24000000000',
              minBet: '1000000',
              maxBet: '500000000',
            }))

            // Simulate odds updates during window
            const oddsUpdates = [
              { oddsA: 0.55, oddsB: 0.45, poolA: '14200000000', poolB: '11600000000', totalPool: '25800000000', timeRemaining: 25 },
              { oddsA: 0.51, oddsB: 0.49, poolA: '14200000000', poolB: '13800000000', totalPool: '28000000000', timeRemaining: 20 },
              { oddsA: 0.58, oddsB: 0.42, poolA: '17400000000', poolB: '12600000000', totalPool: '30000000000', timeRemaining: 15 },
              { oddsA: 0.60, oddsB: 0.40, poolA: '18000000000', poolB: '12000000000', totalPool: '30000000000', timeRemaining: 5 },
            ]

            for (const update of oddsUpdates) {
              await new Promise(r => setTimeout(r, 5_000))
              controller.enqueue(sendEvent('betting_window_update', {
                windowId,
                ...update,
                lastBet: { side: update.oddsA > 0.55 ? 'A' : 'B', amount: '5000000000', address: '0xBa3c...f8e1' },
              }))
            }

            // Close window
            await new Promise(r => setTimeout(r, 5_000))
            controller.enqueue(sendEvent('betting_window_close', {
              windowId,
              finalOddsA: 0.60,
              finalOddsB: 0.40,
              totalPool: '30000000000',
            }))

            broadcast.status = 'revelation'
          }
        }

        // Dramatic pause before revelation
        await new Promise(r => setTimeout(r, 2_500))

        // Stream the revelation (AI chose EXPOSE — 60% had bet on it)
        const revealSegments = REVELATION_SEGMENTS.EXPOSE
        for (let i = 0; i < revealSegments.length; i++) {
          controller.enqueue(sendEvent('text_delta', {
            content: revealSegments[i],
            chunkIndex: CHAPTER_STORY_SEGMENTS.length + i,
          }))
          await new Promise(r => setTimeout(r, 120))
        }

        // Revelation event
        await new Promise(r => setTimeout(r, 800))
        controller.enqueue(sendEvent('revelation', {
          winningSide: 'A',
          winningChoice: 'Expose',
          justification: 'House Valdris\'s survival instinct demands transparency — hiding the Stitcher protects Obsidian, not Valdris. The heir chose honesty over political safety.',
          oddsAtClose: { A: 0.60, B: 0.40 },
          totalPool: '30000000000',
          winnerPoolShare: '25500000000',  // 85%
        }))

        // Payout complete
        await new Promise(r => setTimeout(r, 1_000))
        controller.enqueue(sendEvent('payout_complete', {
          payouts: {
            '0xBa3c...f8e1': '8500000000',   // 8,500 USDC
            '0xE2f1...9aB3': '4250000000',   // 4,250 USDC
            '0x71Ac...2d8F': '12750000000',  // 12,750 USDC
          },
          totalPaid: '25500000000',
        }))

        // Broadcast complete
        broadcast.status = 'complete'
        controller.enqueue(sendEvent('broadcast_complete', {
          chapterId,
          totalWords: broadcast.textBuffer.split(' ').length,
          viewerPeak: broadcast.viewerCount + 4783,  // Add simulated viewers
          choiceMade: 'Expose',
          nextBroadcastIn: 86400,  // 24h
        }))

        if (viewerAddress) broadcast.viewerCount--
        controller.close()

      } catch (err) {
        controller.enqueue(sendEvent('error', {
          message: err instanceof Error ? err.message : 'Unknown error',
        }))
        controller.close()
      }
    },

    cancel() {
      if (viewerAddress && broadcast.viewerCount > 0) broadcast.viewerCount--
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',   // Disable Nginx buffering
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// ─── POST: Place a live bet ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    broadcastId: string
    windowId: string
    bettorAddress: string
    side: 'A' | 'B'
    amount: string     // BigInt as string
  }

  const broadcast = activeBroadcasts.get(body.broadcastId)
  if (!broadcast || broadcast.status !== 'window_open') {
    return Response.json({ success: false, error: 'No active betting window' }, { status: 400 })
  }

  // In production: validate wallet signature, check balance, submit on-chain tx
  // For POC: accept and return mock updated odds

  const newOddsA = 0.58 + Math.random() * 0.04
  return Response.json({
    success: true,
    betId: `bet_${Date.now()}`,
    newOddsA: newOddsA.toFixed(4),
    newOddsB: (1 - newOddsA).toFixed(4),
    confirmedAmount: body.amount,
    estimatedPayout: (Number(body.amount) * 1.35).toFixed(0),
  })
}
