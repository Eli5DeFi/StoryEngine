'use client'

import { StatsOverview } from '@/components/analytics/StatsOverview'
import { Leaderboard } from '@/components/analytics/Leaderboard'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gold/20 bg-void-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-foreground/70 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-cinzel font-bold text-gold">
              Analytics Dashboard
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Stats Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsOverview />
        </motion.section>

        {/* Leaderboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Leaderboard />
        </motion.section>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-12"
        >
          <h3 className="text-2xl font-cinzel font-bold text-gold mb-4">
            Want to climb the leaderboard?
          </h3>
          <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
            Read our stories, analyze the choices, and place strategic bets to 
            win big and claim your spot among the top predictors.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold/90 text-void-950 rounded-lg font-bold transition-all"
          >
            Browse Stories
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
