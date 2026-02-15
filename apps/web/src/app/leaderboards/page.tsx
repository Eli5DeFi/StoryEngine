import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'

// Lazy load leaderboards component (includes framer-motion)
const Leaderboards = dynamic(
  () => import('@/components/leaderboards/Leaderboards').then(mod => ({ default: mod.Leaderboards })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading leaderboards...</p>
        </div>
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

// Static generation with hourly revalidation
export const revalidate = 3600

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
