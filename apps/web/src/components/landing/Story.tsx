'use client'

import { motion } from 'framer-motion'
import { Book, Zap, Trophy, Users } from 'lucide-react'

export function Story() {
  const features = [
    {
      icon: Book,
      title: 'AI-Generated Fiction',
      description: 'GPT-4 and Claude weave interactive narratives that adapt to community predictions.',
      color: 'var(--gold)',
    },
    {
      icon: Zap,
      title: 'Prediction Markets',
      description: 'Bet USDC on which narrative branch the AI will choose. Wisdom of the crowd meets storytelling.',
      color: 'var(--drift-teal)',
    },
    {
      icon: Trophy,
      title: 'Win Rewards',
      description: '85% of the pool goes to winners. Parimutuel betting ensures fair odds and exciting payouts.',
      color: 'var(--amber)',
    },
    {
      icon: Users,
      title: 'Shape the Narrative',
      description: 'Your bets influence the AI. The community collectively guides the story\'s direction.',
      color: 'var(--drift-purple)',
    },
  ]

  return (
    <section id="story" className="relative py-[--section-pad]">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-space) 50%, var(--bg-deep) 100%)',
        }}
      />

      <div className="container-custom relative z-10">
        {/* Section header */}
        <div className="section-header">
          <span className="section-label">◈ THE EXPERIENCE ◈</span>
          <h2 className="section-title">
            Where Stories <span className="text-gradient-gold">Meet Markets</span>
          </h2>
          <p className="section-subtitle">
            A new form of interactive entertainment powered by AI and blockchain prediction markets.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="card-glass p-8 group"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-6 transition-all duration-500"
                style={{
                  background: `rgba(${feature.color === 'var(--gold)' ? '212, 168, 83' : feature.color === 'var(--drift-teal)' ? '0, 229, 200' : feature.color === 'var(--amber)' ? '232, 146, 58' : '168, 85, 247'}, 0.1)`,
                  border: `1px solid rgba(${feature.color === 'var(--gold)' ? '212, 168, 83' : feature.color === 'var(--drift-teal)' ? '0, 229, 200' : feature.color === 'var(--amber)' ? '232, 146, 58' : '168, 85, 247'}, 0.2)`,
                }}
              >
                <feature.icon
                  className="w-7 h-7"
                  style={{ color: feature.color }}
                />
              </div>

              {/* Content */}
              <h3
                className="text-xl font-semibold mb-3"
                style={{ fontFamily: 'var(--font-display)', color: feature.color }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
