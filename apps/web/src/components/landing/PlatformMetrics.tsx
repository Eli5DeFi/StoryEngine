'use client'

import { motion } from 'framer-motion'
import { Users, BookText, Coins, Zap } from 'lucide-react'

export function PlatformMetrics() {
  const metrics = [
    {
      icon: Users,
      label: 'Total Users',
      value: '15,234',
      subtext: '+2,847 this month',
      color: 'text-blue-500',
    },
    {
      icon: BookText,
      label: 'Stories Created',
      value: '847',
      subtext: '128 active today',
      color: 'text-purple-500',
    },
    {
      icon: Coins,
      label: 'Total Value Locked',
      value: '$2.4M',
      subtext: 'In active betting pools',
      color: 'text-green-500',
    },
    {
      icon: Zap,
      label: 'AI Decisions Made',
      value: '12,458',
      subtext: '94.7% accuracy rate',
      color: 'text-yellow-500',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Platform <span className="text-gradient">Metrics</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Real-time stats from the world's first blockchain-integrated AI story betting platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-background border border-border rounded-xl p-6 text-center card-hover"
            >
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-4`}>
                <metric.icon className={`w-8 h-8 ${metric.color}`} />
              </div>
              <div className="text-4xl font-bold mb-2">{metric.value}</div>
              <div className="text-sm font-medium text-foreground/80 mb-1">{metric.label}</div>
              <div className="text-xs text-foreground/60">{metric.subtext}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
