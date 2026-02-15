'use client'

import { Code2, Zap, Shield } from 'lucide-react'

export function AgentIntegration() {
  return (
    <section id="agent-integration" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1E1B3A] to-[#0F172A]" />
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div 
            className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            For Developers
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#F1F5F9] mb-4" style={{ letterSpacing: '-1px' }}>
            Build AI Agents
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Autonomous agents can read, analyze, and bet on Voidborne narratives
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Code2 className="w-6 h-6" />}
            title="Complete API"
            description="REST endpoints with TypeScript SDK. Fetch stories, analyze pools, place bets."
            strandColor="rgba(99,102,241,0.2)"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Smart Contracts"
            description="On-chain betting with viem/wagmi. Fully decentralized, verifiable outcomes."
            strandColor="rgba(245,158,11,0.2)"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Agent Examples"
            description="5 production bots included: sentiment, arbitrage, AMM, analysis, auto-bet."
            strandColor="rgba(16,185,129,0.2)"
          />
        </div>

        {/* Code Example */}
        <div 
          className="p-8 rounded-[14px] mb-12"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(99,102,241,0.2)',
                boxShadow: '0 0 20px rgba(99,102,241,0.15)',
              }}
            >
              <Code2 className="w-5 h-5 text-[#F1F5F9]" />
            </div>
            <h3 className="text-xl font-display font-bold text-[#F1F5F9]">
              Quick Start
            </h3>
          </div>
          
          <pre 
            className="rounded-lg p-6 overflow-x-auto"
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <code 
              className="text-sm text-[#94A3B8]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
{`// Fetch current story
const story = await fetch('/api/stories/voidborne-story')
  .then(r => r.json())

// Get active betting chapter
const chapter = story.chapters.find(c => c.status === 'BETTING')

// Place bet on-chain (viem)
await bettingPool.write.placeBet([
  branchIndex,  // 0, 1, or 2
  amount        // USDC (6 decimals)
])`}
            </code>
          </pre>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="https://github.com/eli5-claw/StoryEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(16,185,129,0.2)',
              boxShadow: '0 0 30px rgba(16,185,129,0.1)',
            }}
          >
            <span className="text-lg font-semibold text-[#F1F5F9]">
              View Documentation
            </span>
          </a>
          <p 
            className="mt-4 text-[11px] uppercase tracking-[2px] text-[#475569]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Full API Reference • Smart Contract ABI • Agent Examples
          </p>
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  strandColor: string
}

function FeatureCard({ icon, title, description, strandColor }: FeatureCardProps) {
  return (
    <div 
      className="p-6 rounded-[14px] transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${strandColor}`,
      }}
    >
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{
          background: strandColor,
          boxShadow: `0 0 20px ${strandColor.replace('0.2', '0.12')}`,
        }}
      >
        <div className="text-[#F1F5F9]">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-display font-bold text-[#F1F5F9] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#94A3B8] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
