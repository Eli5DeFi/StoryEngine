'use client'

import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 50% 80%, rgba(212, 168, 83, 0.06) 0%, transparent 60%),
          radial-gradient(ellipse at 20% 50%, rgba(0, 229, 200, 0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 30%, rgba(168, 85, 247, 0.03) 0%, transparent 50%),
          linear-gradient(180deg, transparent 0%, rgba(5, 6, 11, 0.4) 100%)
        `
      }} />

      <div className="container-custom relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="section-label">◈ NARRATIVEFORGE ◈</span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 mb-6"
          >
            Wager on <span className="text-gradient-gold">AI Fate</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-[--text-secondary] mb-12 leading-relaxed max-w-3xl mx-auto"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Prediction market meets interactive fiction. Bet USDC on story choices. 
            Watch AI weave narratives. Win rewards when you predict correctly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <ConnectWallet />
            <button className="btn-secondary">
              Explore Stories
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            <div className="stat">
              <span className="stat-value">$847K</span>
              <span className="stat-label">Total Wagered</span>
            </div>
            <div className="stat">
              <span className="stat-value">15.2K</span>
              <span className="stat-label">Predictors</span>
            </div>
            <div className="stat">
              <span className="stat-value">284</span>
              <span className="stat-label">Stories Forged</span>
            </div>
            <div className="stat">
              <span className="stat-value">94.7%</span>
              <span className="stat-label">AI Accuracy</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-[--text-muted]">
            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-ui)' }}>
              Scroll to Explore
            </span>
            <ArrowDown
              className="w-5 h-5"
              style={{ animation: 'scrollBounce 2s infinite' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
