'use client'

/**
 * /prophecies/[chapterId] — Chapter Prophecy Gallery
 *
 * Shows all prophecies for a specific chapter with:
 *  - Chapter info header
 *  - Fulfillment summary (resolved chapters)
 *  - Individual prophecy cards with mint button
 *  - "My Mints" section (connected wallet)
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ProphecyGallery } from '@/components/prophecy/ProphecyGallery'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import type { ProphecyData } from '@/components/prophecy/ProphecyCard'

interface ChapterData {
  id: string
  chapterNumber: number
  title: string
  storyId: string
  story: { id: string; title: string }
}

interface ChapterResponse {
  chapter: ChapterData
  prophecies: ProphecyData[]
  summary: {
    total: number
    totalMinted: number
    fulfilled: number
    echoed: number
    unfulfilled: number
    pending: number
  }
}

interface UserMint {
  prophecyId: string
  mintOrder: number
  forgePaid: number
  prophecy: { id: string }
}

export default function ChapterProphecyPage() {
  const params = useParams()
  const chapterId = params.chapterId as string
  const { address } = useAccount()

  const [data, setData] = useState<ChapterResponse | null>(null)
  const [userMints, setUserMints] = useState<UserMint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/prophecies/${chapterId}`)
      if (!res.ok) throw new Error('Chapter not found')
      const json = await res.json() as ChapterResponse
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [chapterId])

  const fetchUserMints = useCallback(async () => {
    if (!address) return
    try {
      const res = await fetch(`/api/prophecies/mint?wallet=${address}`)
      if (res.ok) {
        const json = await res.json()
        setUserMints(json.mints ?? [])
      }
    } catch {
      // Non-critical
    }
  }, [address])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchUserMints() }, [fetchUserMints])

  // Merge user mint data into prophecies
  const propheciesWithMints: ProphecyData[] = (data?.prophecies ?? []).map((p) => {
    const userMint = userMints.find((m) => m.prophecy?.id === p.id)
    return userMint
      ? { ...p, userMint: { mintOrder: userMint.mintOrder, forgePaid: userMint.forgePaid } }
      : p
  })

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060b]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-6">
            <div className="h-8 w-64 rounded bg-void-900/60 animate-pulse" />
            <div className="h-4 w-40 rounded bg-void-900/40 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-lg border border-void-800/30 bg-void-950/40 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#05060b]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <div className="text-4xl text-void-700">⊗</div>
          <p className="text-void-500 font-mono">{error ?? 'Chapter not found'}</p>
          <Link href="/prophecies" className="text-xs font-mono text-void-500 hover:text-amber-400 underline transition-colors">
            ← Back to Prophecies
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const { chapter, summary } = data
  const myMintedProphecies = propheciesWithMints.filter((p) => p.userMint)

  // ─── Page ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#05060b]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        {/* Breadcrumb */}
        <nav className="text-xs font-mono text-void-600 flex items-center gap-2">
          <Link href="/" className="hover:text-void-400 transition-colors">Home</Link>
          <span>·</span>
          <Link href="/prophecies" className="hover:text-void-400 transition-colors">Prophecies</Link>
          <span>·</span>
          <Link href={`/story/${chapter.storyId}`} className="hover:text-void-400 transition-colors">
            {chapter.story.title}
          </Link>
          <span>·</span>
          <span className="text-void-400">Ch.{chapter.chapterNumber}</span>
        </nav>

        {/* Chapter header */}
        <div className="space-y-3">
          <p className="text-[11px] font-mono text-void-500 uppercase tracking-widest">
            {chapter.story.title}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-void-100"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Chapter {chapter.chapterNumber} — {chapter.title}
          </h1>
          <p className="text-void-400 text-sm font-mono">
            {summary.total} prophecies sealed before this chapter resolved
          </p>
        </div>

        {/* Chapter resolution banner (if resolved) */}
        {summary.pending === 0 && summary.total > 0 && (
          <div className={[
            'rounded-lg border p-5 space-y-2',
            summary.fulfilled > 0
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-void-700/30 bg-void-950/40',
          ].join(' ')}>
            <p
              className="text-lg text-void-100"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              {summary.fulfilled > 0
                ? `★ ${summary.fulfilled} Prophecies Fulfilled`
                : 'Chapter Resolved — No Prophecies Fulfilled'}
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-mono">
              {summary.fulfilled > 0 && (
                <span className="text-amber-400">
                  {summary.fulfilled} Legendary golden artifacts created
                </span>
              )}
              {summary.echoed > 0 && (
                <span className="text-slate-300">
                  {summary.echoed} Echoed — silver artifacts
                </span>
              )}
              {summary.unfulfilled > 0 && (
                <span className="text-void-500">
                  {summary.unfulfilled} Void Relics (unfulfilled)
                </span>
              )}
            </div>
          </div>
        )}

        {/* My Mints section */}
        {myMintedProphecies.length > 0 && (
          <section className="space-y-4">
            <h2
              className="text-xl text-void-100 border-b border-void-800/30 pb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Your Prophecies ({myMintedProphecies.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myMintedProphecies.map((p) => (
                <div
                  key={p.id}
                  className={[
                    'rounded-lg border p-4',
                    p.status === 'FULFILLED'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : p.status === 'ECHOED'
                      ? 'border-slate-500/30 bg-slate-500/5'
                      : 'border-void-700/30 bg-void-950/40',
                  ].join(' ')}
                >
                  <div className="text-xs font-mono text-void-500 mb-2">
                    Mint #{p.userMint!.mintOrder} of {p.maxSupply}
                  </div>
                  <p
                    className="text-sm italic text-void-300 leading-relaxed"
                    style={{ fontFamily: 'var(--font-cinzel)' }}
                  >
                    &ldquo;{p.text ?? p.teaser}&rdquo;
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-mono ${
                      p.status === 'FULFILLED' ? 'text-amber-400' :
                      p.status === 'ECHOED' ? 'text-slate-300' :
                      p.status === 'PENDING' ? 'text-void-400' : 'text-void-600'
                    }`}>
                      {p.status === 'FULFILLED' ? '★ Fulfilled' :
                       p.status === 'ECHOED' ? '◈ Echoed' :
                       p.status === 'PENDING' ? '▓ Sealed' : '▪ Void Relic'}
                    </span>
                    <span className="text-xs font-mono text-void-600">
                      {p.userMint!.forgePaid} $FORGE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All prophecies gallery */}
        <section>
          <ProphecyGallery
            prophecies={propheciesWithMints}
            chapterTitle={chapter.title}
            chapterNumber={chapter.chapterNumber}
            storyTitle={chapter.story.title}
            summary={summary}
            onRefresh={() => { fetchData(); fetchUserMints() }}
          />
        </section>

      </main>

      <Footer />
    </div>
  )
}
