'use client'

import { useEffect, useState } from 'react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        background: scrolled ? 'rgba(5, 6, 11, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(212, 168, 83, 0.1)' : 'none',
        padding: scrolled ? '10px 0' : '16px 0',
      }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span
              className="text-2xl"
              style={{
                color: 'var(--gold)',
                animation: 'glyphPulse 3s infinite',
              }}
            >
              ⬡
            </span>
            <span
              className="text-lg uppercase tracking-wider font-semibold hidden sm:block"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}
            >
              NarrativeForge
            </span>
          </a>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#story"
              className="text-sm uppercase tracking-wider transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-secondary)',
              }}
            >
              Features
            </a>
            <a
              href="#mechanics"
              className="text-sm uppercase tracking-wider transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-secondary)',
              }}
            >
              How It Works
            </a>
            <a
              href="/stories"
              className="text-sm uppercase tracking-wider transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-secondary)',
              }}
            >
              Stories
            </a>
          </div>

          {/* CTA */}
          <ConnectWallet />
        </div>
      </div>
    </nav>
  )
}
