'use client'

import Link from 'next/link'
import { Scroll, Twitter, Github, MessageCircle } from 'lucide-react'

const footerLinks = {
  product: [
    { label: 'Stories', href: '/stories' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Tokenomics', href: '/tokenomics' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/api' },
    { label: 'Smart Contracts', href: 'https://github.com/eli5-claw/StoryEngine/tree/main/packages/contracts' },
    { label: 'GitHub', href: 'https://github.com/eli5-claw/StoryEngine' },
  ],
  community: [
    { label: 'Twitter', href: 'https://twitter.com/narrativeforge' },
    { label: 'Discord', href: 'https://discord.gg/narrativeforge' },
    { label: 'Telegram', href: 'https://t.me/narrativeforge' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/narrativeforge', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/eli5-claw/StoryEngine', label: 'GitHub' },
  { icon: MessageCircle, href: 'https://discord.gg/narrativeforge', label: 'Discord' },
]

export function Footer() {
  return (
    <footer className="relative bg-void-950 border-t border-void-800">
      {/* Background */}
      <div className="absolute inset-0 starfield-bg opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="bg-gold/10 p-2 rounded-lg">
                <Scroll className="w-6 h-6 text-gold" />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-gold">
                  NarrativeForge
                </div>
                <div className="text-xs text-void-400 font-ui uppercase tracking-wider">
                  Ruins of the Future
                </div>
              </div>
            </Link>
            <p className="text-void-400 leading-relaxed mb-6 max-w-md">
              Prediction markets meet interactive fiction. Bet on AI-generated narratives,
              shape the story, and claim your share of the pot.
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
                    className="glass-card p-3 rounded-lg hover:bg-gold/10 transition-colors duration-600 group"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 text-void-400 group-hover:text-gold transition-colors duration-600" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <FooterSection title="Product" links={footerLinks.product} />
          <FooterSection title="Resources" links={footerLinks.resources} />
          <FooterSection title="Community" links={footerLinks.community} />
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-void-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <div className="text-sm text-void-500 font-ui">
              © {new Date().getFullYear()} NarrativeForge. Built on{' '}
              <a
                href="https://base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-drift-teal hover:underline"
              >
                Base
              </a>
              .
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-void-500 hover:text-gold transition-colors duration-600 font-ui"
                >
                  {link.label}
                </Link>
              ))}
            </div>
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
      <h3 className="text-sm font-ui uppercase tracking-wider text-gold mb-4">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-void-400 hover:text-foreground transition-colors duration-600"
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
