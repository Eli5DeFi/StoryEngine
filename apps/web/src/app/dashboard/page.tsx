import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, BarChart3, User } from 'lucide-react'
import { Metadata } from 'next'

// Lazy load heavy components for better initial load
const PlatformStats = dynamic(() => import('@/components/betting/PlatformStats').then(mod => ({ default: mod.PlatformStats })), {
  loading: () => <div className="h-48 animate-pulse bg-muted rounded-lg" />,
  ssr: false,
})

const RecentActivityFeed = dynamic(() => import('@/components/betting/RecentActivityFeed').then(mod => ({ default: mod.RecentActivityFeed })), {
  loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
  ssr: false,
})

const CommunityPulse = dynamic(() => import('@/components/betting/CommunityPulse').then(mod => ({ default: mod.CommunityPulse })), {
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  ssr: false,
})

// Lazy load framer-motion wrapper
const AnimatedSection = dynamic(() => import('@/components/ui/AnimatedSection'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Betting Dashboard | Voidborne',
  description: 'Real-time betting statistics, community pulse, and recent activity on Voidborne.',
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gold/20 bg-void-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-foreground/70 hover:text-gold transition-colors"
                aria-label="Go back to homepage"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-cinzel font-bold text-gold">
                Betting Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/my-bets"
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg border border-void-800 hover:border-gold/50 transition-all text-sm font-ui font-semibold text-foreground"
              >
                <User className="w-4 h-4" />
                <span>My Bets</span>
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg border border-void-800 hover:border-gold/50 transition-all text-sm font-ui font-semibold text-foreground"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Platform Stats */}
        <AnimatedSection delay={0.1}>
          <PlatformStats />
        </AnimatedSection>

        {/* Community Pulse */}
        <AnimatedSection delay={0.2}>
          <CommunityPulse />
        </AnimatedSection>

        {/* Recent Activity Feed */}
        <AnimatedSection delay={0.3}>
          <RecentActivityFeed />
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection delay={0.4}>
          <div className="text-center py-12">
            <h2 className="text-2xl font-cinzel font-bold text-gold mb-4">
              See a hot pool?
            </h2>
            <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
              Jump into the action and place your bets before the pools close. 
              May the odds be in your favor.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold/90 text-void-950 rounded-lg font-bold transition-all"
            >
              Browse Stories
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
