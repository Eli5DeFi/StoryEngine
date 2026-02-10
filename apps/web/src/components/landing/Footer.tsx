'use client'

import { Twitter, Github, MessageCircle, BookOpen } from 'lucide-react'

export function Footer() {
  const links = {
    product: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Stories', href: '#stories' },
      { label: '$FORGE Token', href: '#tokenomics' },
      { label: 'Roadmap', href: '#roadmap' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-docs' },
      { label: 'Smart Contracts', href: '/contracts' },
      { label: 'Whitepaper', href: '/whitepaper' },
    ],
    community: [
      { label: 'Discord', href: 'https://discord.gg/narrativeforge' },
      { label: 'Twitter', href: 'https://twitter.com/narrativeforge' },
      { label: 'Telegram', href: 'https://t.me/narrativeforge' },
      { label: 'Forum', href: '/forum' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  }

  const socials = [
    { icon: Twitter, href: 'https://twitter.com/narrativeforge', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/narrativeforge', label: 'GitHub' },
    { icon: MessageCircle, href: 'https://discord.gg/narrativeforge', label: 'Discord' },
    { icon: BookOpen, href: '/docs', label: 'Docs' },
  ]

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="text-2xl font-bold text-gradient mb-4">
              NarrativeForge
            </div>
            <p className="text-sm text-foreground/60 mb-4">
              The blockchain-integrated AI story generation platform where readers bet on narrative choices.
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-primary" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              {links.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-foreground/60">
              © 2026 NarrativeForge. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-foreground/60">
              <span>Powered by <span className="text-primary font-medium">Bankr</span></span>
              <span>•</span>
              <span>Built on <span className="text-primary font-medium">Base</span></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
