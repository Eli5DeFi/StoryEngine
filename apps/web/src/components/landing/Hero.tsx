'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { ClientOnly } from '@/components/ClientOnly'

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden starfield-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-drift-teal/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-drift-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 text-center">
        {/* Ceremonial Header */}
        <div className="mb-8 opacity-0 ambient-fade">
          <div className="text-ceremonial mb-4">
            The Grand Conclave
          </div>
          <div className="w-24 h-px mx-auto ceremonial-divider" />
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-8 opacity-0 ambient-fade stagger-1">
          <span className="block text-gold gold-glow-strong">
            VOIDBORNE
          </span>
          <span className="block text-foreground mt-4">
            The Silent Throne
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-void-300 max-w-3xl mx-auto mb-12 leading-relaxed opacity-0 ambient-fade stagger-2">
          Navigate deadly succession politics. <br />
          <span className="text-drift-teal">Bet on which path shapes the narrative.</span> <br />
          <span className="text-gold">Five houses. Five agendas. One choice.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 opacity-0 ambient-fade stagger-3">
          <Link 
            href="/story/voidborne-story"
            className="btn-primary text-lg px-10 py-4 inline-block"
          >
            Enter the Conclave
          </Link>
          
          <ClientOnly>
            <ConnectWallet />
          </ClientOnly>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto opacity-0 ambient-fade stagger-4">
          <StatsCard
            value="$127K"
            label="Total Wagered"
            gradient="drift-teal"
          />
          <StatsCard
            value="1,247"
            label="Active Bettors"
            gradient="gold"
          />
          <StatsCard
            value="89%"
            label="Avg. Payout Rate"
            gradient="drift-purple"
          />
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  )
}

interface StatsCardProps {
  value: string
  label: string
  gradient: 'gold' | 'drift-teal' | 'drift-purple'
}

function StatsCard({ value, label, gradient }: StatsCardProps) {
  const gradientClasses = {
    'gold': 'from-gold/20 to-gold/5',
    'drift-teal': 'from-drift-teal/20 to-drift-teal/5',
    'drift-purple': 'from-drift-purple/20 to-drift-purple/5',
  }

  const textColors = {
    'gold': 'text-gold',
    'drift-teal': 'text-drift-teal',
    'drift-purple': 'text-drift-purple',
  }

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className={`text-4xl font-display font-bold mb-2 tabular-nums ${textColors[gradient]}`}>
        {value}
      </div>
      <div className="text-sm text-void-400 font-ui uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
