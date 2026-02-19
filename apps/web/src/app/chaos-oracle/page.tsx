'use client'

/**
 * /chaos-oracle — Full Chaos Oracle Protocol dashboard
 *
 * Shows all real-world signals, their narrative mappings, chaos intensity,
 * historical context, and the Claude prompt block for the next chapter.
 *
 * Innovation Cycle #53 — "The Living Story Protocol"
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChaosOracleWidget } from '@/components/chaos-oracle/ChaosOracleWidget'
import { AlertTriangle, BookOpen, Globe, Zap, Info } from 'lucide-react'
import Link from 'next/link'

interface ChaosOracleData {
  signals: Array<{
    metric: string
    metricLabel: string
    valueFormatted: string
    direction: string
    intensity: number
    source: string
    mapping: {
      narrativeEffect: string
      houseBeneficiary: string
      houseBurdened: string
      promptFragment: string
    }
  }>
  chaosIntensity: 'calm' | 'tense' | 'volatile' | 'maelstrom'
  dominantEffect: string
  chapterMoodOverride: string
  cachedAt: string
  isMock: boolean
}

const INTENSITY_COPY: Record<string, { title: string; description: string; colour: string }> = {
  calm: {
    title: 'Calm Waters',
    description: 'Real-world markets are quiet. The narrative will be driven by internal politics and character motivations. Subtle chapter ahead.',
    colour: 'text-emerald-400',
  },
  tense: {
    title: 'Tense Atmosphere',
    description: 'Market signals are agitated. Expect increased faction pressure and unexpected plot developments in the next chapter.',
    colour: 'text-amber-400',
  },
  volatile: {
    title: 'Volatile Conditions',
    description: 'Significant turbulence in real-world signals. The story will reflect instability — expect crisis moments and faction conflicts.',
    colour: 'text-orange-400',
  },
  maelstrom: {
    title: 'MAELSTROM',
    description: 'Extreme market conditions. Rare CHAOS CRISIS event — the chapter AI will be forced to address multiple narrative debts simultaneously. Historic moment.',
    colour: 'text-red-400',
  },
}

export default function ChaosOraclePage() {
  const [data, setData] = useState<ChaosOracleData | null>(null)
  const [promptBlock, setPromptBlock] = useState<string | null>(null)
  const [loadingPrompt, setLoadingPrompt] = useState(false)

  useEffect(() => {
    fetch('/api/chaos-oracle/signals')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  async function fetchPromptBlock() {
    setLoadingPrompt(true)
    try {
      const resp = await fetch('/api/chaos-oracle/chapter-context?chapter=next')
      const json = await resp.json()
      setPromptBlock(json.promptBlock)
    } catch {
      setPromptBlock('Error fetching prompt block.')
    } finally {
      setLoadingPrompt(false)
    }
  }

  const intensityInfo = data ? INTENSITY_COPY[data.chaosIntensity] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-amber-400" />
              <p className="text-xs text-amber-400 font-mono uppercase tracking-widest">
                Innovation Cycle #53
              </p>
            </div>
            <h1 className="text-4xl font-cinzel font-bold text-white mb-3">
              Chaos Oracle Protocol
            </h1>
            <p className="text-white/60 max-w-2xl leading-relaxed">
              Real-world signals — crypto prices, social sentiment, on-chain activity —
              are mapped to Voidborne's narrative parameters before each chapter is
              generated. The story literally reacts to market conditions.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — widget + prompt block */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Intensity Callout */}
            {data && intensityInfo && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className={`rounded-xl border bg-black/30 p-5 ${
                  data.chaosIntensity === 'maelstrom'
                    ? 'border-red-800/50'
                    : data.chaosIntensity === 'volatile'
                    ? 'border-orange-800/50'
                    : data.chaosIntensity === 'tense'
                    ? 'border-amber-800/50'
                    : 'border-emerald-900/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  {data.chaosIntensity === 'maelstrom' ? (
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${intensityInfo.colour}`} />
                  ) : (
                    <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${intensityInfo.colour}`} />
                  )}
                  <div>
                    <h3 className={`font-cinzel font-semibold text-sm mb-1 ${intensityInfo.colour}`}>
                      {intensityInfo.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {intensityInfo.description}
                    </p>
                    <p className="text-white/40 text-xs mt-2 italic">
                      Chapter mood: "{data.chapterMoodOverride}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Signal Widget — full version */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <ChaosOracleWidget className="w-full" />
            </motion.div>

            {/* Claude Prompt Block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-xl border border-white/5 bg-black/40 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-cinzel font-semibold text-white/80">
                    Claude System Prompt Block
                  </h3>
                </div>
                <button
                  onClick={fetchPromptBlock}
                  disabled={loadingPrompt}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 border border-purple-800/50 px-3 py-1 rounded-md"
                >
                  {loadingPrompt ? 'Generating…' : promptBlock ? 'Refresh' : 'Preview'}
                </button>
              </div>

              {promptBlock ? (
                <pre className="p-5 text-[11px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                  {promptBlock}
                </pre>
              ) : (
                <div className="p-5 text-center">
                  <p className="text-white/30 text-sm">
                    Click "Preview" to see what gets injected into Claude's system prompt before the next chapter generation.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column — how it works */}
          <div className="space-y-5">
            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-xl border border-white/5 bg-black/30 p-5"
            >
              <h3 className="text-sm font-cinzel font-semibold text-white/70 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                How It Works
              </h3>
              <ol className="space-y-3 text-xs text-white/50 leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="text-amber-400 font-mono font-bold flex-shrink-0">01</span>
                  <span>Real-world signals fetched hourly from CoinGecko, social APIs, and on-chain data.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-amber-400 font-mono font-bold flex-shrink-0">02</span>
                  <span>Each signal is mapped to a Voidborne narrative parameter (faction power, Void corruption, alliance shifts).</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-amber-400 font-mono font-bold flex-shrink-0">03</span>
                  <span>Before each chapter generation, top 3 signals are injected into Claude's system prompt as in-world environmental context.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-amber-400 font-mono font-bold flex-shrink-0">04</span>
                  <span>Claude weaves the signals into the chapter organically — no raw market data, only translated lore.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-amber-400 font-mono font-bold flex-shrink-0">05</span>
                  <span>Players can bet on which chaos signal will appear in the next chapter (2× multiplier if correct).</span>
                </li>
              </ol>
            </motion.div>

            {/* Signal sources */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-xl border border-white/5 bg-black/30 p-5"
            >
              <h3 className="text-sm font-cinzel font-semibold text-white/70 mb-3">
                Signal Sources
              </h3>
              <div className="space-y-2 text-xs text-white/40">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400">₿ BTC 24h Change</span>
                  <span>CoinGecko (free)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400">Ξ ETH 24h Change</span>
                  <span>CoinGecko (free)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">👁 Voidborne Mentions</span>
                  <span>Social (simulated)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400">⚡ $FORGE Volume</span>
                  <span>On-chain (simulated)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">∿ Narrative Entropy</span>
                  <span>Internal state</span>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Link
                href="/"
                className="block w-full text-center py-3 rounded-lg border border-amber-700/50 bg-amber-950/30 text-amber-400 text-sm font-cinzel hover:bg-amber-950/50 transition-colors"
              >
                Read the Story →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
