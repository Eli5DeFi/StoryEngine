'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'

export function CTA() {
  return (
    <section id="cta" className="relative py-32 overflow-hidden">
      {/* Floating glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--gold), transparent)',
            animation: 'orbPulse 3s infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--drift-teal), transparent)',
            animation: 'orbPulse 2s infinite',
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="section-label">◈ JOIN THE FORGE ◈</span>
          
          <h2
            className="mt-8 mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Begin Your <span className="text-gradient-gold">Prediction</span>
          </h2>

          <p
            className="text-xl mb-12 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Connect your wallet and enter a universe where your predictions shape AI-generated narratives. 
            Every bet is a choice. Every choice writes history.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <ConnectWallet />
            <button className="btn-secondary flex items-center gap-2">
              View Live Stories
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Base L2 badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded"
            style={{
              background: 'rgba(0, 229, 200, 0.05)',
              border: '1px solid rgba(0, 229, 200, 0.1)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[--drift-teal] animate-pulse" />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-ui)', color: 'var(--drift-teal)' }}
            >
              Powered by Base L2 • USDC Betting
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
