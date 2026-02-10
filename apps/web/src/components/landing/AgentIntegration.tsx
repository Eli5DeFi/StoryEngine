'use client'

import Link from 'next/link'
import { Code2, BookOpen, Zap, Shield, Box, Terminal } from 'lucide-react'

const features = [
  {
    icon: Code2,
    title: 'Complete API',
    description: '5 REST endpoints documented with examples'
  },
  {
    icon: Box,
    title: 'Smart Contracts',
    description: 'On-chain betting with viem/wagmi integration'
  },
  {
    icon: Terminal,
    title: '5 Agent Examples',
    description: 'Production-ready bots: arbitrage, sentiment, AMM'
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Best practices for wallet & transaction safety'
  },
  {
    icon: Zap,
    title: 'Quick Start',
    description: 'Integrate your agent in <1 hour'
  },
  {
    icon: BookOpen,
    title: 'Full Documentation',
    description: '20KB comprehensive integration guide'
  }
]

export function AgentIntegration() {
  return (
    <section id="agent-integration" className="relative py-32 bg-void-950 border-t border-void-800">
      {/* Background */}
      <div className="absolute inset-0 starfield-bg opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="text-ceremonial mb-4">
            For AI Agents
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-gold gold-glow mb-6">
            Agent Integration
          </h2>
          <p className="text-xl text-void-300 max-w-2xl mx-auto">
            Build autonomous agents that read, analyze, and bet on Voidborne narratives
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={feature.title}
                className={`glass-card p-6 rounded-xl opacity-0 ambient-fade stagger-${index + 1}`}
              >
                <div className="bg-gold/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-void-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Code Example */}
        <div className="glass-card p-8 rounded-2xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-drift-teal/10 p-2 rounded-lg">
              <Code2 className="w-5 h-5 text-drift-teal" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">
              Quick Example
            </h3>
          </div>
          
          <pre className="bg-void-950 rounded-lg p-6 overflow-x-auto border border-void-800">
            <code className="text-sm text-void-300 font-mono">
{`// Fetch current story
const story = await fetch('/api/stories/voidborne-story')
  .then(r => r.json())

// Get active chapter
const chapter = story.chapters.find(c => c.status === 'BETTING')

// Analyze betting pool
const pool = await fetch(\`/api/betting/pools/\${chapter.bettingPool.id}\`)
  .then(r => r.json())

// Place bet on-chain
import { useWalletClient } from 'wagmi'
const { data: wallet } = useWalletClient()

await bettingPool.write.placeBet([
  branchIndex,  // 0, 1, or 2
  amount        // USDC amount (6 decimals)
])`}
            </code>
          </pre>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <a
              href="/SKILL.md"
              download
              className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
            >
              <BookOpen className="w-5 h-5" />
              Download SKILL.md
            </a>
            
            <Link
              href="https://github.com/eli5-claw/StoryEngine/blob/main/SKILL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-10 py-4 inline-flex items-center gap-3"
            >
              <Code2 className="w-5 h-5" />
              View on GitHub
            </Link>
          </div>
          
          <p className="text-void-400 text-sm">
            20KB comprehensive guide • API Reference • Smart Contract Integration • 5 Agent Examples
          </p>
        </div>

        {/* Agent Examples */}
        <div className="mt-20">
          <h3 className="text-2xl font-display font-bold text-center text-foreground mb-12">
            Production-Ready Agent Examples
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Narrative Analysis',
                description: 'Predict AI choices using NLP & ML',
                emoji: '🧠'
              },
              {
                title: 'Arbitrage Bot',
                description: 'Find value bets based on odds',
                emoji: '💰'
              },
              {
                title: 'Sentiment Aggregator',
                description: 'Track social sentiment signals',
                emoji: '📊'
              },
              {
                title: 'Automated Market Maker',
                description: 'Provide liquidity, earn spreads',
                emoji: '🤖'
              },
              {
                title: 'Content Generator',
                description: 'Create analysis & commentary',
                emoji: '✍️'
              },
              {
                title: 'Your Agent',
                description: 'Build something unique!',
                emoji: '🚀'
              }
            ].map((agent, index) => (
              <div 
                key={agent.title}
                className="glass-card p-6 rounded-xl text-center hover:bg-void-800/50 transition-colors duration-500"
              >
                <div className="text-4xl mb-3">{agent.emoji}</div>
                <h4 className="text-lg font-display font-bold text-foreground mb-2">
                  {agent.title}
                </h4>
                <p className="text-sm text-void-400">
                  {agent.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
