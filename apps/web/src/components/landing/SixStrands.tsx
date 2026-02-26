'use client'

import { useState, useEffect } from 'react'

const strands = [
  {
    id: 'g-strand',
    name: 'G-STRAND',
    label: 'Gravity / Space',
    color: '#60A5FA',
    icon: '⊕',
  },
  {
    id: 'l-strand',
    name: 'L-STRAND',
    label: 'Light / Energy',
    color: '#F59E0B',
    icon: '✸',
  },
  {
    id: 's-strand',
    name: 'S-STRAND',
    label: 'Entropy / Time',
    color: '#EF4444',
    icon: '◈',
  },
  {
    id: 'r-strand',
    name: 'R-STRAND',
    label: 'Matter / Form',
    color: '#10B981',
    icon: '⬡',
  },
  {
    id: 'c-strand',
    name: 'C-STRAND',
    label: 'Consciousness',
    color: '#A78BFA',
    icon: '◉',
  },
  {
    id: 'o-strand',
    name: 'Ø-STRAND',
    label: 'Null / Void',
    color: '#6B7280',
    icon: '⊘',
  },
]

export function SixStrands() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
      {/* Cinematic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/void-portal.jpg')`,
          filter: 'brightness(0.4)',
        }}
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <h2 
          className="font-display font-black tracking-wider text-center mb-20"
          style={{ 
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'white',
          }}
        >
          SIX STRANDS. ONE VOID.
        </h2>

        {/* Strands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {strands.map((strand, index) => (
            <StrandCard key={strand.id} strand={strand} index={index} />
          ))}
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
    </section>
  )
}

interface StrandCardProps {
  strand: {
    id: string
    name: string
    label: string
    color: string
    icon: string
  }
  index: number
}

function StrandCard({ strand, index }: StrandCardProps) {
  return (
    <div 
      className="group relative p-8 rounded-xl transition-all duration-300 hover:scale-105 animate-fadeIn"
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${strand.color}40`,
        boxShadow: `0 0 30px ${strand.color}20`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Icon */}
      <div 
        className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ color: strand.color }}
      >
        {strand.icon}
      </div>

      {/* Strand Name */}
      <div 
        className="text-sm font-bold mb-2"
        style={{ 
          color: strand.color,
          fontFamily: 'monospace',
          letterSpacing: '0.15em',
        }}
      >
        {strand.name}
      </div>

      {/* Label */}
      <div className="text-gray-300 text-sm">
        {strand.label}
      </div>

      {/* Hover Glow Effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${strand.color}10, transparent 70%)`,
        }}
      />
    </div>
  )
}
