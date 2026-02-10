'use client'

import { useState } from 'react'
import { Menu, X, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gradient">
              NarrativeForge
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition">
              How It Works
            </a>
            <a href="#stories" className="text-foreground/80 hover:text-foreground transition">
              Stories
            </a>
            <a href="#tokenomics" className="text-foreground/80 hover:text-foreground transition">
              $FORGE Token
            </a>
            <a href="#about" className="text-foreground/80 hover:text-foreground transition">
              About
            </a>
            <Button className="bg-primary hover:bg-primary/90">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-foreground/80 transition"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="#how-it-works"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-primary/10 rounded-md transition"
            >
              How It Works
            </a>
            <a
              href="#stories"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-primary/10 rounded-md transition"
            >
              Stories
            </a>
            <a
              href="#tokenomics"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-primary/10 rounded-md transition"
            >
              $FORGE Token
            </a>
            <a
              href="#about"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-primary/10 rounded-md transition"
            >
              About
            </a>
            <div className="px-3 py-2">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
