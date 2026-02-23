'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/throne-hero.jpg')`,
          filter: 'brightness(0.6)',
        }}
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      
      {/* Subtle Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Main Headline - Bold Wide Tech Font */}
        <h1 
          className="font-display font-black tracking-wider mb-6 animate-fadeIn"
          style={{ 
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          <span className="block text-white">
            THE SILENT THRONE
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12 animate-fadeIn"
          style={{ animationDelay: '0.2s' }}
        >
          A political thriller carved into the bones of a dead cosmos.
        </p>

        {/* CTA Buttons - Tech Style */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <Link 
            href="/lore"
            className="group relative px-8 py-3 overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              fontSize: '0.875rem',
            }}
          >
            <span className="relative text-white uppercase">
              &gt; INITIATE_LINK
            </span>
          </Link>
          
          <Link 
            href="/story/voidborne-story"
            className="group relative px-8 py-3 overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              fontSize: '0.875rem',
            }}
          >
            <span className="relative text-white uppercase">
              ENTER THE LATTICE
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  )
}
