'use client'

import Link from 'next/link'
import { Twitter, Github } from 'lucide-react'

const footerLinks = {
  explore: [
    { label: 'Explore Lore', href: '/lore' },
    { label: 'Read Story', href: '/story/voidborne-story' },
    { label: 'Leaderboards', href: '/leaderboards' },
    { label: 'Analytics', href: '/analytics' },
  ],
  resources: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'GitHub', href: 'https://github.com/eli5-claw/StoryEngine' },
    { label: 'Smart Contracts', href: 'https://github.com/eli5-claw/StoryEngine/tree/main/packages/contracts' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/Eli5DeFi', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/eli5-claw/StoryEngine', label: 'GitHub' },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] to-[#1E1B3A]" />
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute w-[500px] h-[500px] bottom-0 left-1/4"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <div className="text-2xl font-display font-extrabold text-[#F1F5F9]" style={{ letterSpacing: '-1px' }}>
                VØ<span className="text-[#64748B]">I</span>DBORNE
              </div>
              <div 
                className="text-[11px] uppercase tracking-[4px] text-[#64748B] mt-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                The Silent Throne
              </div>
            </Link>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-6 max-w-md">
              Navigate deadly succession politics. Bet on which path shapes the narrative.
              Five houses. Five agendas. One choice.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg transition-all duration-200 hover:scale-110"
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 text-[#94A3B8] hover:text-[#6366F1] transition-colors duration-200" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <FooterSection title="Explore" links={footerLinks.explore} />
          <FooterSection title="Resources" links={footerLinks.resources} />
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.06)]">
          <div 
            className="text-center text-[11px] uppercase tracking-[2px] text-[#475569]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            © {new Date().getFullYear()} Voidborne · Built on{' '}
            <a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6366F1] hover:text-[#818CF8] transition-colors duration-200"
            >
              Base
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

interface FooterSectionProps {
  title: string
  links: Array<{ label: string; href: string }>
}

function FooterSection({ title, links }: FooterSectionProps) {
  return (
    <div>
      <h3 
        className="text-[11px] uppercase tracking-[3px] text-[#64748B] mb-4"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors duration-200"
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
