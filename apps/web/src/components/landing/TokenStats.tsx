'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react'

export function TokenStats() {
  const stats = [
    {
      icon: DollarSign,
      label: '$FORGE Price',
      value: '$0.0042',
      change: '+12.5%',
      positive: true,
    },
    {
      icon: BarChart3,
      label: 'Market Cap',
      value: '$4.2M',
      change: '+8.3%',
      positive: true,
    },
    {
      icon: TrendingUp,
      label: '24h Volume',
      value: '$847K',
      change: '+24.7%',
      positive: true,
    },
    {
      icon: Users,
      label: 'Holders',
      value: '12,458',
      change: '+156',
      positive: true,
    },
  ]

  return (
    <section id="tokenomics" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">$FORGE Token</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Self-sustaining platform powered by trading fees. Buy $FORGE to participate in betting pools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div
                  className={`text-sm font-medium ${
                    stat.positive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-foreground/60">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Bankr integration info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-xl p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">
                Powered by <span className="text-gradient">Bankr</span>
              </h3>
              <p className="text-foreground/70">
                Trading fees automatically fund AI story generation. The more $FORGE trades, the more stories we can create. Self-sustaining ecosystem with zero ongoing costs.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-foreground/80">Live on Base</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-foreground/80">Cross-chain ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-foreground/80">Gas-sponsored trades</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
