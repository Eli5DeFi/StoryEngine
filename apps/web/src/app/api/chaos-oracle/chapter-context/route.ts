/**
 * GET /api/chaos-oracle/chapter-context?chapter={n}
 *
 * Returns a structured Claude system-prompt block derived from current
 * Chaos Oracle signals — ready to inject before AI chapter generation.
 *
 * Called by the chapter-generation cron job before each Claude call.
 * Returns the prompt fragment + metadata about intensity and dominant signals.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const chapter = parseInt(req.nextUrl.searchParams.get('chapter') ?? '1', 10)

  try {
    // Fetch signals from our own signals route (internal)
    const base = req.nextUrl.origin
    const signalsResp = await fetch(`${base}/api/chaos-oracle/signals`)
    if (!signalsResp.ok) {
      return NextResponse.json({ error: 'Could not fetch chaos signals' }, { status: 502 })
    }

    const { signals, chaosIntensity, dominantEffect } = await signalsResp.json()

    const top = (signals ?? []).slice(0, 3)

    const lines: string[] = [
      `───────────────────────────────────────────────────`,
      `CHAOS ORACLE PROTOCOL — CHAPTER ${chapter}`,
      `Environmental Intensity: ${(chaosIntensity ?? 'calm').toUpperCase()}`,
      `Real-world signals shaping today's narrative context:`,
      `───────────────────────────────────────────────────`,
    ]

    for (const signal of top) {
      const pct = ((signal.intensity ?? 0) * 100).toFixed(0)
      lines.push(``)
      lines.push(`[${signal.metric}] (intensity ${pct}% — ${signal.direction})`)
      lines.push(signal.mapping?.promptFragment ?? '')
      lines.push(`→ Narrative effect: ${signal.mapping?.narrativeEffect ?? ''}`)
      lines.push(`→ Benefits: House ${(signal.mapping?.houseBeneficiary ?? 'none').toUpperCase()}`)
      lines.push(`→ Burdens: House ${(signal.mapping?.houseBurdened ?? 'none').toUpperCase()}`)
    }

    lines.push(``)
    lines.push(`───────────────────────────────────────────────────`)
    lines.push(`INSTRUCTION: Weave the above environmental context`)
    lines.push(`naturally into the chapter's atmosphere. Do NOT`)
    lines.push(`mention "markets", "BTC", or real-world entities`)
    lines.push(`explicitly — translate to in-world equivalents:`)
    lines.push(`  trade routes, Strand flux, Conclave treasury,`)
    lines.push(`  resource caravans, Void anomalies, etc.`)
    lines.push(`Keep chaos references subtle and organic.`)

    const promptBlock = lines.join('\n')

    return NextResponse.json({
      chapterNumber: chapter,
      promptBlock,
      chaosIntensity,
      dominantEffect,
      signalCount: top.length,
    })
  } catch (error) {
    console.error('[chaos-oracle/chapter-context] Error:', error)
    return NextResponse.json(
      { error: 'Chapter context unavailable' },
      { status: 500 },
    )
  }
}
