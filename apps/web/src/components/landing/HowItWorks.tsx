'use client'

import { motion } from 'framer-motion'
import { BookOpen, Vote, Sparkles, Trophy } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: BookOpen,
      title: 'Read the Story',
      description: 'Dive into AI-generated interactive fiction. Each chapter ends with a critical choice.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Vote,
      title: 'Bet on Choices',
      description: 'Predict which branch the AI will choose. Place your $FORGE bet in the parimutuel pool.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'AI Decides',
      description: 'Our AI analyzes story coherence, reader preferences, and narrative quality to pick the best path.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Trophy,
      title: 'Win Rewards',
      description: 'Correct bets win 85% of the pool. Platform earns 12.5% treasury, 2.5% dev fees.',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Four simple steps to start betting on AI story choices and winning $FORGE tokens
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <div className="relative bg-card border border-border rounded-xl p-6 card-hover h-full">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${step.color} mb-4`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-foreground/70">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Example flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 bg-card border border-border rounded-xl p-8"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">Example Pool</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1,000 $FORGE</div>
              <div className="text-sm text-foreground/60 mb-4">Total Pool</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Choice A:</span>
                  <span className="font-medium">400 $FORGE (40%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Choice B:</span>
                  <span className="font-medium">600 $FORGE (60%)</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">Choice A</div>
              <div className="text-sm text-foreground/60 mb-4">AI Picks This!</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Winners share:</span>
                  <span className="font-medium text-green-500">850 $FORGE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Treasury:</span>
                  <span className="font-medium">125 $FORGE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Dev fee:</span>
                  <span className="font-medium">25 $FORGE</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 mb-2">2.125x</div>
              <div className="text-sm text-foreground/60 mb-4">Payout Multiplier</div>
              <div className="space-y-2 text-sm">
                <div className="text-foreground/70 mb-2">Your bet:</div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">100 $FORGE →</span>
                  <span className="font-medium text-green-500">212.5 $FORGE</span>
                </div>
                <div className="text-xs text-green-500 mt-2">
                  +112.5 $FORGE profit! 🎉
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
