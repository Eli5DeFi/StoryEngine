'use client'

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Wallet } from 'lucide-react'
import { PerformanceOverview } from '@/components/dashboard/PerformanceOverview'
import { BettingHistoryTable } from '@/components/dashboard/BettingHistoryTable'
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'

export default function MyBetsPage() {
  const { address, isConnected } = useAccount()
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d' | '24h'>('all')

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-12"
          >
            <Wallet className="w-16 h-16 text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-cinzel font-bold text-gold mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-foreground/70 mb-8">
              Connect your wallet to view your betting history and performance analytics.
            </p>
            <ConnectWallet />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gold/20 bg-void-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-foreground/70 hover:text-gold transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-cinzel font-bold text-gold">
                My Betting Dashboard
              </h1>
            </div>

            {/* Time Filter */}
            <div className="flex gap-2">
              {(['all', '30d', '7d', '24h'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeframe === tf
                      ? 'bg-gold text-void-950'
                      : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
                  }`}
                >
                  {tf === 'all' ? 'All Time' : tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Performance Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PerformanceOverview walletAddress={address!} timeframe={timeframe} />
        </motion.section>

        {/* Performance Charts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PerformanceCharts walletAddress={address!} timeframe={timeframe} />
        </motion.section>

        {/* Betting History */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BettingHistoryTable walletAddress={address!} timeframe={timeframe} />
        </motion.section>
      </div>
    </div>
  )
}
