/**
 * Narrative Liquidity Pools - Trading Page
 * 
 * Main page for swapping betting positions and managing liquidity.
 * Demonstrates the power of continuous trading for story outcomes.
 * 
 * @author Voidborne Team (Innovation Cycle #46)
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { SwapInterface } from '@/components/nlp/SwapInterface';
import { PoolDashboard } from '@/components/nlp/PoolDashboard';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletIcon, TrendingUpIcon, InfoIcon } from 'lucide-react';

// Example chapter data (in production, fetch from API)
const EXAMPLE_CHAPTER = {
  id: 15,
  title: 'The Silent Throne',
  outcomes: [
    { id: 0, text: 'Negotiate with rebels', color: '#2DD4BF' },
    { id: 1, text: 'Attack rebel base', color: '#d4a853' },
    { id: 2, text: 'Retreat and regroup', color: '#8B5CF6' },
  ],
};

export default function NLPPage() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'swap' | 'pools'>('swap');

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-space via-void-purple to-deep-space">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-cinzel text-gold mb-4">
            Narrative Liquidity Pools
          </h1>
          <p className="text-xl text-white/70 font-space-grotesk max-w-2xl mx-auto">
            Trade story outcomes like stocks. Exit early, cut losses, or take profits
            before resolution. Welcome to the future of betting.
          </p>
        </div>

        {/* Info Banner */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-drift-teal/10 border border-drift-teal/30 rounded-2xl p-6 flex items-start gap-4">
            <InfoIcon className="w-6 h-6 text-drift-teal flex-shrink-0 mt-1" />
            <div className="text-sm text-white/80">
              <p className="font-semibold text-drift-teal mb-2">
                🌊 Innovation Cycle #46: Programmable Story Economy
              </p>
              <p>
                Swap betting positions anytime before chapter resolution using automated
                market makers (AMMs). Cut your losses (50% better than 100%), take early
                profits, or flip positions based on new story developments.
              </p>
              <ul className="mt-3 space-y-1 text-white/70">
                <li>✓ Real-time price discovery</li>
                <li>✓ 0.3% swap fee (0.25% to LPs, 0.05% to protocol)</li>
                <li>✓ Slippage protection</li>
                <li>✓ Continuous liquidity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connect Wallet Prompt */}
        {!isConnected ? (
          <div className="max-w-md mx-auto bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-12 text-center">
            <WalletIcon className="w-16 h-16 text-gold mx-auto mb-6" />
            <h2 className="text-2xl font-cinzel text-white mb-4">Connect Your Wallet</h2>
            <p className="text-white/70 mb-8">
              Connect your wallet to start trading story outcomes on the NLP.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveTab('swap')}
                className={`px-6 py-3 rounded-xl font-space-grotesk transition-all ${
                  activeTab === 'swap'
                    ? 'bg-gold text-void-purple'
                    : 'bg-void-purple/30 text-white/70 hover:bg-void-purple/50'
                }`}
              >
                <TrendingUpIcon className="w-5 h-5 inline mr-2" />
                Swap
              </button>

              <button
                onClick={() => setActiveTab('pools')}
                className={`px-6 py-3 rounded-xl font-space-grotesk transition-all ${
                  activeTab === 'pools'
                    ? 'bg-gold text-void-purple'
                    : 'bg-void-purple/30 text-white/70 hover:bg-void-purple/50'
                }`}
              >
                <WalletIcon className="w-5 h-5 inline mr-2" />
                Pools
              </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeTab === 'swap' ? (
                  <SwapInterface
                    chapterId={EXAMPLE_CHAPTER.id}
                    outcomes={EXAMPLE_CHAPTER.outcomes}
                  />
                ) : (
                  <PoolDashboard
                    chapterId={EXAMPLE_CHAPTER.id}
                    outcomes={EXAMPLE_CHAPTER.outcomes}
                  />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Chapter Info */}
                <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
                  <h3 className="text-xl font-cinzel text-gold mb-4">Current Chapter</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                        Chapter ID
                      </p>
                      <p className="font-mono text-white">#{EXAMPLE_CHAPTER.id}</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                        Title
                      </p>
                      <p className="text-white">{EXAMPLE_CHAPTER.title}</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                        Outcomes
                      </p>
                      <div className="space-y-2 mt-2">
                        {EXAMPLE_CHAPTER.outcomes.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: outcome.color }}
                            />
                            <span className="text-white/80">{outcome.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* How It Works */}
                <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
                  <h3 className="text-xl font-cinzel text-gold mb-4">How It Works</h3>
                  <ol className="space-y-3 text-sm text-white/70">
                    <li className="flex gap-3">
                      <span className="bg-gold text-void-purple w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        1
                      </span>
                      <span>
                        Place initial bet (parimutuel) → receive LP tokens
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-gold text-void-purple w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        2
                      </span>
                      <span>
                        Swap LP tokens anytime before resolution
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-gold text-void-purple w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        3
                      </span>
                      <span>
                        Exit early or flip positions based on new info
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-gold text-void-purple w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        4
                      </span>
                      <span>
                        Claim winnings after chapter resolves
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Stats */}
                <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
                  <h3 className="text-xl font-cinzel text-gold mb-4">Live Stats</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">24h Volume:</span>
                      <span className="font-mono text-drift-teal">$42,350</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Total Swaps:</span>
                      <span className="font-mono text-white">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Active Traders:</span>
                      <span className="font-mono text-white">342</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Avg Price Impact:</span>
                      <span className="font-mono text-white">0.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
