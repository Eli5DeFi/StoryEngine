'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Scroll } from 'lucide-react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { ClientOnly } from '@/components/ClientOnly'

const navLinks = [
  { label: 'Explore Lore', href: '/lore' },
  { label: 'Read Story', href: '/story/voidborne-story' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Leaderboards', href: '/leaderboards' },
  { label: 'Analytics', href: '/analytics' },
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-void-800 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-gold/10 p-2 rounded-lg group-hover:bg-gold/20 transition-colors duration-500">
                <Scroll className="w-6 h-6 text-gold" />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-gold">
                  Voidborne
                </div>
                <div className="text-xs text-void-400 font-ui uppercase tracking-wider">
                  The Silent Throne
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-ui text-void-300 hover:text-gold transition-colors duration-500 uppercase tracking-wider"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block">
              <ClientOnly>
                <ConnectWallet />
              </ClientOnly>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-foreground hover:text-gold transition-colors duration-500"
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
            className="absolute inset-0 bg-background/95 backdrop-blur-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="relative h-full flex flex-col items-center justify-center gap-8 px-6">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-2xl font-display text-foreground hover:text-gold transition-colors duration-500 opacity-0 ambient-fade stagger-${index + 1}`}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-8 opacity-0 ambient-fade stagger-5">
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
