'use client'

import { Brain, Coins, TrendingUp, Trophy } from 'lucide-react'

const steps = [
  {
    icon: Brain,
    title: 'AI Generates Story Branches',
    description: 'At each chapter, our AI creates multiple possible narrative paths. Each branch offers a unique continuation of the story.',
    color: 'drift-purple',
  },
  {
    icon: Coins,
    title: 'Place Your Bet',
    description: 'Bet USDC on which branch you think the AI will choose. Your prediction shapes the parimutuel pool.',
    color: 'gold',
  },
  {
    icon: TrendingUp,
    title: 'AI Makes the Choice',
    description: 'The AI evaluates all branches using narrative coherence, reader engagement, and story momentum to select the winning path.',
    color: 'drift-teal',
  },
  {
    icon: Trophy,
    title: 'Winners Share the Pot',
    description: '85% of the pool goes to winners. 12.5% funds the treasury. 2.5% supports platform development.',
    color: 'gold',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 bg-gradient-to-b from-background via-void-950 to-background">
      {/* Decorative Background */}
      <div className="absolute inset-0 starfield-bg opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="text-ceremonial mb-4">
            The Protocol
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-gold gold-glow mb-6">
            How It Works
          </h2>
          <p className="text-xl text-void-300 max-w-2xl mx-auto">
            Four steps from spectator to storyteller
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={step}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="glass-card inline-block p-8 rounded-2xl">
            <p className="text-lg text-void-300 mb-6 max-w-2xl">
              <span className="text-gold font-semibold">Self-sustaining economy:</span> All trading fees from <span className="text-gold">$FORGE</span> token
              fund AI compute. Zero ongoing costs. Infinite scalability.
            </p>
            <a
              href="#stories"
              className="btn-primary inline-block"
            >
              Start Reading & Betting
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

interface StepCardProps {
  step: typeof steps[0]
  index: number
}

function StepCard({ step, index }: StepCardProps) {
  const Icon = step.icon

  const colorClasses = {
    'gold': {
      iconBg: 'bg-gold/10',
      iconText: 'text-gold',
      border: 'border-gold/30',
    },
    'drift-teal': {
      iconBg: 'bg-drift-teal/10',
      iconText: 'text-drift-teal',
      border: 'border-drift-teal/30',
    },
    'drift-purple': {
      iconBg: 'bg-drift-purple/10',
      iconText: 'text-drift-purple',
      border: 'border-drift-purple/30',
    },
  }

  const colors = colorClasses[step.color as keyof typeof colorClasses]

  return (
    <div className={`glass-card p-8 rounded-2xl relative overflow-hidden group opacity-0 ambient-fade stagger-${index + 1}`}>
      {/* Step Number */}
      <div className="absolute top-4 right-4 text-6xl font-display font-bold text-void-900 opacity-20">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Icon */}
      <div className={`${colors.iconBg} ${colors.iconText} w-16 h-16 rounded-xl flex items-center justify-center mb-6 relative z-10`}>
        <Icon className="w-8 h-8" />
      </div>

      {/* Content */}
      <h3 className="text-2xl font-display font-bold text-foreground mb-4 relative z-10">
        {step.title}
      </h3>
      <p className="text-void-300 leading-relaxed relative z-10">
        {step.description}
      </p>

      {/* Hover Glow */}
      <div className={`absolute inset-0 ${colors.border} border opacity-0 group-hover:opacity-100 transition-opacity duration-600 rounded-2xl pointer-events-none`} />
    </div>
  )
}
