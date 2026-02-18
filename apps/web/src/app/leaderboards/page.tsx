import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Metadata } from 'next'

// Lazy-load Leaderboards — pulls in recharts + framer-motion which are heavy.
// Dynamic import creates a separate chunk so the 630 kB isn't paid on initial load.
const Leaderboards = dynamic(
  () => import('@/components/leaderboards/Leaderboards').then(mod => ({ default: mod.Leaderboards })),
  {
    loading: () => (
      <div className="space-y-6">
        {/* Skeleton tabs */}
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-28 rounded-full animate-pulse bg-white/5" />
          ))}
        </div>
        {/* Skeleton rows */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse bg-white/5" style={{ opacity: 1 - i * 0.07 }} />
        ))}
      </div>
    ),
    ssr: false,
  }
)

export const metadata: Metadata = {
  title: 'The Void Champions | Voidborne Leaderboards',
  description: 'See the top winners, best predictors, and legendary streaks on Voidborne. Compete for glory and bragging rights.',
  openGraph: {
    title: 'The Void Champions | Voidborne Leaderboards',
    description: 'Legends who mastered the art of prediction. Can you join their ranks?',
    images: ['/og-leaderboards.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Void Champions | Voidborne',
    description: 'Top winners, best predictors, legendary streaks. Compete for glory.',
    images: ['/og-leaderboards.png'],
  },
}

// Revalidate every 5 minutes (leaderboards change frequently)
export const revalidate = 300

export default function LeaderboardsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Leaderboards />
      </div>

      <Footer />
    </main>
  )
}
