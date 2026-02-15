'use client'

import Link from 'next/link'
import { BookMarked, Users, Sparkles } from 'lucide-react'

export function FeaturedStories() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0F172A]" />
      
      {/* Ambient Strand Glow */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute w-[500px] h-[500px] top-1/4 right-1/4"
          style={{
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 60%)',
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
            Universe
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#F1F5F9] mb-4" style={{ letterSpacing: '-1px' }}>
            Explore the Lore
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Deep dive into the Voidborne universe—houses, protocols, and the powers that shape reality
          </p>
        </div>

        {/* Lore Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <LoreCard
            icon={<Users className="w-6 h-6" />}
            title="Seven Houses"
            description="From Valdris navigators to Meridian traders, each house fights for the Silent Throne"
            href="/lore/houses"
            count="7 Houses"
            strandColor="rgba(99,102,241,0.2)"
          />
          <LoreCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Resonant Protocols"
            description="Fourteen distinct powers drawn from the Lattice—each with a terrible cost"
            href="/lore/protocols"
            count="14 Protocols"
            strandColor="rgba(245,158,11,0.2)"
          />
          <LoreCard
            icon={<BookMarked className="w-6 h-6" />}
            title="Key Characters"
            description="Meet the players in this deadly game of succession and power"
            href="/lore/characters"
            count="5 Protagonists"
            strandColor="rgba(167,139,250,0.2)"
          />
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/lore"
            className="inline-block px-10 py-4 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 0 30px rgba(245,158,11,0.1)',
            }}
          >
            <span className="text-lg font-semibold text-[#F1F5F9]">
              View All Lore
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

interface LoreCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  count: string
  strandColor: string
}

function LoreCard({ icon, title, description, href, count, strandColor }: LoreCardProps) {
  return (
    <Link
      href={href}
      className="group relative p-8 rounded-[14px] transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${strandColor}`,
      }}
    >
      {/* Icon with Glow */}
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all duration-200 group-hover:shadow-lg"
        style={{
          background: strandColor,
          boxShadow: `0 0 20px ${strandColor.replace('0.2', '0.12')}`,
        }}
      >
        <div className="text-[#F1F5F9]">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div 
        className="text-[10px] uppercase tracking-[3px] text-[#64748B] mb-3"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {count}
      </div>
      <h3 className="text-2xl font-display font-bold text-[#F1F5F9] mb-3">
        {title}
      </h3>
      <p className="text-sm text-[#94A3B8] leading-relaxed">
        {description}
      </p>

      {/* Hover Arrow */}
      <div className="mt-4 text-[#6366F1] group-hover:translate-x-1 transition-transform duration-200">
        →
      </div>
    </Link>
  )
}
