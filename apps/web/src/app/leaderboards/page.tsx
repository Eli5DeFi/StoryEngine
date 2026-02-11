import { Leaderboards } from '@/components/leaderboards/Leaderboards'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Metadata } from 'next'

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
