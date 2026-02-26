'use client'

import { useState, useEffect } from 'react'

const protocols = [
  {
    code: 'SR-01',
    name: 'SEVERANCE',
    description: 'Complete Strand severance protocol',
  },
  {
    code: 'NL-ø',
    name: 'NULLIFICATION',
    description: 'Emergency void containment',
  },
  {
    code: 'AX-09',
    name: 'AXIOM',
    description: 'Lattice compliance enforcement',
  },
]

export function Protocols() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden py-20">
      {/* Cinematic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/protocols-bg.jpg')`,
          filter: 'brightness(0.3)',
        }}
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          {/* Label */}
          <div 
            className="text-xs uppercase mb-4 animate-fadeIn"
            style={{ 
              color: '#EF4444',
              letterSpacing: '0.2em',
              fontFamily: 'monospace',
            }}
          >
            COMPLIANCE MANDATORY
          </div>

          {/* Section Title */}
          <h2 
            className="font-display font-black tracking-wider mb-6 animate-fadeIn"
            style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'white',
              animationDelay: '0.1s',
            }}
          >
            THE PROTOCOLS.
          </h2>

          {/* Subtitle */}
          <p 
            className="text-gray-300 text-lg mb-12 animate-fadeIn"
            style={{ animationDelay: '0.2s' }}
          >
            There are no warnings. Only thresholds. Cross them, and the Lattice responds.
          </p>

          {/* Protocols List */}
          <div className="space-y-4">
            {protocols.map((protocol, index) => (
              <ProtocolCard key={protocol.code} protocol={protocol} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
    </section>
  )
}

interface ProtocolCardProps {
  protocol: {
    code: string
    name: string
    description: string
  }
  index: number
}

function ProtocolCard({ protocol, index }: ProtocolCardProps) {
  return (
    <div 
      className="group relative p-6 rounded-lg transition-all duration-300 hover:scale-[1.02] animate-fadeIn"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        animationDelay: `${0.3 + index * 0.1}s`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Protocol Code */}
        <div 
          className="px-3 py-1 rounded text-xs font-bold"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
          }}
        >
          {protocol.code}
        </div>

        {/* Protocol Info */}
        <div className="flex-1">
          <div 
            className="text-white font-bold text-lg mb-1"
            style={{ 
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            {protocol.name}
          </div>
          <div className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
            {protocol.description}
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.05), transparent)',
        }}
      />
    </div>
  )
}
