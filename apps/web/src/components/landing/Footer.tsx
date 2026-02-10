'use client'

import { Twitter, Github, MessageCircle } from 'lucide-react'

export function Footer() {
  const links = {
    product: [
      { label: 'How It Works', href: '#mechanics' },
      { label: 'Stories', href: '/stories' },
      { label: 'About', href: '/about' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API', href: '/api-docs' },
      { label: 'Smart Contracts', href: '/contracts' },
    ],
    community: [
      { label: 'Discord', href: 'https://discord.gg/narrativeforge' },
      { label: 'Twitter', href: 'https://twitter.com/narrativeforge' },
      { label: 'GitHub', href: 'https://github.com/narrativeforge' },
    ],
  }

  return (
    <footer className="relative border-t border-[--border] py-16">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
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
                className="text-xl uppercase tracking-wider font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}
              >
                NarrativeForge
              </span>
            </div>
            
            <p
              className="text-sm leading-relaxed mb-6 max-w-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Prediction market meets interactive fiction. Bet on AI story choices using USDC. 
              Shape narratives. Win rewards.
            </p>

            <div className="flex gap-3">
              <a
                href="https://twitter.com/narrativeforge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: 'rgba(212, 168, 83, 0.05)', 
                  border: '1px solid rgba(212, 168, 83, 0.1)' 
                }}
              >
                <Twitter className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </a>
              <a
                href="https://github.com/narrativeforge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: 'rgba(212, 168, 83, 0.05)', 
                  border: '1px solid rgba(212, 168, 83, 0.1)' 
                }}
              >
                <Github className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </a>
              <a
                href="https://discord.gg/narrativeforge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: 'rgba(212, 168, 83, 0.05)', 
                  border: '1px solid rgba(212, 168, 83, 0.1)' 
                }}
              >
                <MessageCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' }}
            >
              Product
            </h4>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors duration-300"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' }}
            >
              Resources
            </h4>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors duration-300"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' }}
            >
              Community
            </h4>
            <ul className="space-y-2">
              {links.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors duration-300"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
          style={{ 
            borderTop: '1px solid rgba(212, 168, 83, 0.05)',
            color: 'var(--text-muted)' 
          }}
        >
          <div>© 2026 NarrativeForge. All rights reserved.</div>
          <div
            className="italic"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-dim)' }}
          >
            "Every prediction shapes the story."
          </div>
        </div>
      </div>
    </footer>
  )
}
