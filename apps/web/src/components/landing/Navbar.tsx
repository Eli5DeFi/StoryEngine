'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { ClientOnly } from '@/components/ClientOnly'

const navLinks = [
  { label: 'LORE', href: '/lore' },
  { label: 'STRANDS', href: '#strands' },
  { label: 'HOUSES', href: '/lore/houses-dynamic' },
  { label: 'PROTOCOLS', href: '#protocols' },
  { label: 'CONTACT', href: '#contact' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="font-display font-black tracking-wider text-xl text-white hover:text-gray-300 transition-colors"
              style={{ letterSpacing: '0.15em' }}
            >
              VØIDBORNE
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                  style={{ 
                    fontFamily: 'monospace',
                    letterSpacing: '0.15em',
                  }}
                >
                  {link.label}
                </a>
              ))}
              <ClientOnly>
                <ConnectWallet />
              </ClientOnly>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-white hover:text-gray-300 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="relative h-full flex flex-col items-center justify-center gap-8 px-6">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-display text-white hover:text-gray-300 transition-colors"
                style={{
                  letterSpacing: '0.1em',
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-8">
              <ClientOnly>
                <ConnectWallet />
              </ClientOnly>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
