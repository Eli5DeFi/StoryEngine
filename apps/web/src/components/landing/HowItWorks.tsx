'use client'

import { BookOpen, Vote, Trophy, Zap } from 'lucide-react'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" />
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div 
            className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Mechanics
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#F1F5F9] mb-4" style={{ letterSpacing: '-1px' }}>
            How It Works
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Four simple steps to shape the narrative
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Step
            number="01"
            icon={<BookOpen className="w-6 h-6" />}
            title="Read the Story"
            description="Follow the succession crisis as it unfolds. Political intrigue across five competing houses."
            strandColor="rgba(99,102,241,0.2)"
          />
          <Step
            number="02"
            icon={<Vote className="w-6 h-6" />}
            title="Place Your Bet"
            description="Bet USDC on which path the story will take. Choose wisely—every choice has consequences."
            strandColor="rgba(245,158,11,0.2)"
          />
          <Step
            number="03"
            icon={<Zap className="w-6 h-6" />}
            title="AI Decides"
            description="Advanced AI weighs narrative coherence, market sentiment, and dramatic tension."
            strandColor="rgba(167,139,250,0.2)"
          />
          <Step
            number="04"
            icon={<Trophy className="w-6 h-6" />}
            title="Winners Split Pot"
            description="Correct predictions split the prize pool. The story continues based on the outcome."
            strandColor="rgba(16,185,129,0.2)"
          />
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <a
            href="/story/voidborne-story"
            className="inline-block px-10 py-4 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 0 30px rgba(99,102,241,0.1)',
            }}
          >
            <span className="text-lg font-semibold text-[#F1F5F9]">
              Start Reading
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

interface StepProps {
  number: string
  icon: React.ReactNode
  title: string
  description: string
  strandColor: string
}

function Step({ number, icon, title, description, strandColor }: StepProps) {
  return (
    <div 
      className="group relative p-8 rounded-[14px] transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${strandColor}`,
      }}
    >
      {/* Number */}
      <div 
        className="text-[11px] uppercase tracking-[3px] text-[#475569] mb-6"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {number}
      </div>

      {/* Icon */}
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all duration-200"
        style={{
          background: strandColor,
          boxShadow: `0 0 20px ${strandColor.replace('0.2', '0.15')}`,
        }}
      >
        <div className="text-[#F1F5F9]">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-display font-bold text-[#F1F5F9] mb-3">
        {title}
      </h3>
      <p className="text-sm text-[#94A3B8] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
