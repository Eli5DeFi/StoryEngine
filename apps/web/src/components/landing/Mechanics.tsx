'use client'

import { motion } from 'framer-motion'

export function Mechanics() {
  const steps = [
    {
      number: '01',
      title: 'Read the Chapter',
      description: 'AI-generated interactive fiction. Each chapter ends with a critical choice.',
    },
    {
      number: '02',
      title: 'Predict & Bet',
      description: 'Place your USDC bet on which path the AI will choose. Parimutuel pool opens.',
    },
    {
      number: '03',
      title: 'AI Decides',
      description: 'Our models analyze story coherence, reader sentiment, and narrative quality.',
    },
    {
      number: '04',
      title: 'Winners Collect',
      description: 'If your prediction was correct, claim your share of 85% of the pool.',
    },
  ]

  return (
    <section id="mechanics" className="relative py-[--section-pad]">
      <div className="container-custom relative z-10">
        {/* Section header */}
        <div className="section-header">
          <span className="section-label">◈ HOW IT WORKS ◈</span>
          <h2 className="section-title">
            Predict the <span className="text-gradient-drift">Narrative</span>
          </h2>
          <p className="section-subtitle">
            Four simple steps from reader to predictor to winner.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >
              {/* Connection line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 opacity-20"
                  style={{ background: 'linear-gradient(90deg, var(--gold-dim), transparent)' }}
                />
              )}

              <div className="card-glass p-8 relative z-10">
                {/* Step number */}
                <div
                  className="inline-block px-4 py-2 rounded mb-4"
                  style={{
                    background: 'rgba(212, 168, 83, 0.1)',
                    border: '1px solid rgba(212, 168, 83, 0.2)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--gold)',
                  }}
                >
                  {step.number}
                </div>

                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}
                >
                  {step.title}
                </h3>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pool distribution */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Fair Pool Distribution
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Every bet contributes to a parimutuel pool with transparent payouts
            </p>
          </div>

          {/* Visual bar */}
          <div className="pool-bar mb-6">
            <div className="pool-winners flex items-center justify-center text-[--bg-deep] font-bold text-sm" style={{ width: '85%', fontFamily: 'var(--font-ui)' }}>
              85% WINNERS
            </div>
            <div className="pool-treasury flex items-center justify-center text-[--bg-deep] font-bold text-xs" style={{ width: '12.5%', fontFamily: 'var(--font-ui)' }}>
              12.5%
            </div>
            <div className="pool-ops flex items-center justify-center text-[--bg-deep] font-bold text-xs" style={{ width: '2.5%', fontFamily: 'var(--font-ui)' }}>
              2.5%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--gold)' }}>Winners</div>
              <div style={{ color: 'var(--text-muted)' }}>85% of pool</div>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--drift-teal)' }}>Treasury</div>
              <div style={{ color: 'var(--text-muted)' }}>12.5% for growth</div>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--drift-purple)' }}>Operations</div>
              <div style={{ color: 'var(--text-muted)' }}>2.5% ops fee</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
