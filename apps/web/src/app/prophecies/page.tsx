/**
 * /prophecies — Global Prophecy Gallery
 *
 * Shows all prophecies across all chapters with:
 *  - Live stats (total minted, fulfilled rate, top oracles)
 *  - Filter by status
 *  - Link to chapter-specific galleries
 *  - Oracle Leaderboard
 *
 * Static generation with 5-min revalidation (prophecy mints are fast but not ultra-real-time)
 */

import type { Metadata } from 'next'
import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { prisma } from '@voidborne/database'

export const revalidate = 300 // 5 min
export const dynamic = 'force-dynamic' // auth-dependent user data

export const metadata: Metadata = {
  title: 'Prophecy NFTs — Voidborne',
  description:
    'Mint cryptic prophecy NFTs before each chapter resolves. Fulfilled prophecies become legendary golden artifacts worth 10× their value.',
}

const ProphecyGallery = dynamicImport(
  () => import('@/components/prophecy/ProphecyGallery').then((m) => ({ default: m.ProphecyGallery })),
  { loading: () => <GalleryPlaceholder />, ssr: false }
)

const OracleLeaderboard = dynamicImport(
  () => import('@/components/prophecy/OracleLeaderboard').then((m) => ({ default: m.OracleLeaderboard })),
  { loading: () => <LeaderboardPlaceholder />, ssr: false }
)

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function getGlobalStats() {
  const [total, fulfilled, echoed, pending, totalMints] = await Promise.all([
    prisma.prophecy.count(),
    prisma.prophecy.count({ where: { status: 'FULFILLED' } }),
    prisma.prophecy.count({ where: { status: 'ECHOED' } }),
    prisma.prophecy.count({ where: { status: 'PENDING' } }),
    prisma.prophecyMint.count(),
  ])

  return { total, fulfilled, echoed, pending, unfulfilled: total - fulfilled - echoed - pending, totalMints }
}

async function getRecentChapters() {
  return prisma.chapter.findMany({
    where: { prophecies: { some: {} } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      story: { select: { id: true, title: true } },
      _count: { select: { prophecies: true } },
      prophecies: {
        select: { status: true, _count: { select: { mints: true } } },
      },
    },
  })
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PropheciesPage() {
  const [stats, chapters] = await Promise.all([getGlobalStats(), getRecentChapters()])

  return (
    <div className="min-h-screen bg-[#05060b]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16 space-y-6">
          <div className="text-[10px] font-mono text-void-600 uppercase tracking-[4px]">
            Innovation Cycle #49
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-void-100 tracking-tight"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Pr<span className="text-void-600">oph</span>ecy NFTs
          </h1>

          <p className="max-w-2xl mx-auto text-void-400 text-lg leading-relaxed">
            The AI generates cryptic prophecies before each chapter resolves.
            Mint one for <span className="text-amber-400 font-mono">5 $FORGE</span>.
            If it comes true — your NFT transforms into a <span className="text-amber-300">legendary golden artifact</span> worth 10×.
          </p>

          {/* Global stats */}
          {stats.total > 0 && (
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {[
                { label: 'Total Prophecies', value: stats.total },
                { label: 'NFTs Minted', value: stats.totalMints },
                { label: 'Fulfilled ★', value: stats.fulfilled, highlight: true },
                { label: 'Currently Open', value: stats.pending },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-3xl font-bold font-mono ${s.highlight ? 'text-amber-400' : 'text-void-200'}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-void-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {stats.total === 0 ? (
          /* Coming soon state */
          <div className="text-center py-24 space-y-6">
            <div
              className="text-6xl text-void-800 select-none"
              aria-hidden
            >
              ▓▓▓
            </div>
            <div>
              <p
                className="text-2xl text-void-500"
                style={{ fontFamily: 'var(--font-cinzel)' }}
              >
                The Seers Await
              </p>
              <p className="text-void-600 font-mono text-sm mt-2">
                Prophecies will appear here before the next chapter begins.
              </p>
            </div>
            <Link
              href="/story"
              className="inline-block px-6 py-2 border border-amber-500/30 rounded text-amber-400 font-mono text-sm hover:border-amber-400/60 hover:bg-amber-500/5 transition-all"
            >
              Read the Story →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main: chapter list + prophecy gallery */}
            <div className="lg:col-span-2 space-y-10">
              {chapters.map((chapter) => {
                const chapterFulfilled = chapter.prophecies.filter((p) => p.status === 'FULFILLED').length
                const chapterPending = chapter.prophecies.filter((p) => p.status === 'PENDING').length
                const totalMinted = chapter.prophecies.reduce((s, p) => s + p._count.mints, 0)

                return (
                  <section key={chapter.id} className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-[11px] font-mono text-void-500 uppercase tracking-widest mb-1">
                          {chapter.story.title}
                        </p>
                        <h2
                          className="text-xl text-void-100"
                          style={{ fontFamily: 'var(--font-cinzel)' }}
                        >
                          Chapter {chapter.chapterNumber} — {chapter.title}
                        </h2>
                      </div>
                      <div className="text-right text-xs font-mono text-void-500 space-y-0.5">
                        <div>{chapter._count.prophecies} prophecies</div>
                        <div>{totalMinted} minted</div>
                        {chapterFulfilled > 0 && (
                          <div className="text-amber-400">{chapterFulfilled} fulfilled ★</div>
                        )}
                        {chapterPending > 0 && (
                          <div className="text-green-400">{chapterPending} open</div>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/prophecies/${chapter.id}`}
                      className="block text-xs font-mono text-void-500 hover:text-amber-400 transition-colors"
                    >
                      View all prophecies for this chapter →
                    </Link>
                  </section>
                )
              })}
            </div>

            {/* Sidebar: Leaderboard */}
            <aside className="space-y-6">
              <div>
                <h3
                  className="text-lg text-void-100 mb-4"
                  style={{ fontFamily: 'var(--font-cinzel)' }}
                >
                  Oracle Leaderboard
                </h3>
                <OracleLeaderboard limit={15} />
              </div>

              {/* How it works */}
              <div className="rounded-lg border border-void-800/30 bg-void-950/40 p-5 space-y-4">
                <h4 className="text-sm font-mono text-void-300 uppercase tracking-widest">How It Works</h4>
                <div className="space-y-3 text-xs text-void-500 font-mono leading-relaxed">
                  <p>
                    <span className="text-void-300">1. Before each chapter</span><br />
                    AI generates 10-20 cryptic prophecies — sealed on-chain.
                  </p>
                  <p>
                    <span className="text-void-300">2. Mint your prophecy</span><br />
                    5 $FORGE per NFT. Max 100 mints per prophecy.
                    Earlier mints = higher prestige tier.
                  </p>
                  <p>
                    <span className="text-void-300">3. Chapter resolves</span><br />
                    Oracle evaluates each prophecy against story events.
                  </p>
                  <p>
                    <span className="text-amber-400">4. Transformation</span><br />
                    ★ Fulfilled → Golden art (10× value)<br />
                    ◈ Echoed → Silver art (3× value)<br />
                    ▪ Void Relic → Still collectible
                  </p>
                  <p>
                    <span className="text-void-300">5. Secondary market</span><br />
                    All tokens tradeable. 5% royalty to Voidborne treasury.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

// ─── Loading Skeletons ──────────────────────────────────────────────────────────

function GalleryPlaceholder() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 rounded-lg border border-void-800/30 animate-pulse bg-void-950/40" />
      ))}
    </div>
  )
}

function LeaderboardPlaceholder() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded border border-void-800/30 animate-pulse bg-void-950/40" />
      ))}
    </div>
  )
}
