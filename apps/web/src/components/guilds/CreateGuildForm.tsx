'use client'

/**
 * CreateGuildForm — Multi-step guild creation form.
 *
 * Steps:
 *   1. Choose House alignment (visual picker with lore)
 *   2. Set name, tag, description
 *   3. Review + submit (requires wallet)
 *
 * Calls POST /api/guilds on submit.
 * On success: redirects to /guilds/[newGuildId]
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ChevronRight,
  ChevronLeft,
  Shield,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import type { HouseAlignment } from '@/lib/guilds'

const HOUSES: {
  id: HouseAlignment
  name: string
  emoji: string
  colorHex: string
  accentHex: string
  title: string
  lore: string
  strengths: string[]
  style: string
}[] = [
  {
    id: 'valdris',
    name: 'House Valdris',
    emoji: '👑',
    colorHex: '#8b7ab8',
    accentHex: '#c4b5fd',
    title: 'The Eternal Throne',
    lore: 'Oldest of the Five Houses. Valdris believes order precedes all. Silver threads flow from the ancient throne — unbroken for a thousand cycles.',
    strengths: ['Disciplined collective betting', 'High territory defense', 'Consistent win rates'],
    style: 'Order-first. Strategic. Honor-bound.',
  },
  {
    id: 'obsidian',
    name: 'House Obsidian',
    emoji: '🌑',
    colorHex: '#334155',
    accentHex: '#94a3b8',
    title: 'The Shadow Court',
    lore: 'Obsidian operates in darkness. Information asymmetry is their weapon. They bet late, bet contrarily, and vanish before resolution.',
    strengths: ['Contrarian bet advantage', 'Shadow territory tactics', 'Intel-based edge'],
    style: 'Secretive. Late movers. Anti-crowd.',
  },
  {
    id: 'aurelius',
    name: 'House Aurelius',
    emoji: '⚖️',
    colorHex: '#d4a853',
    accentHex: '#fde68a',
    title: 'The Golden Compact',
    lore: "Gold threads bind every agreement. Aurelius sees the narrative as a market — every alliance has a price, every choice an expected value.",
    strengths: ['Treasury optimization', 'Trade-focused yield', 'Alliance networking'],
    style: 'Profit-first. Systematic. Rational.',
  },
  {
    id: 'strand',
    name: 'The Grand Strand',
    emoji: '🌀',
    colorHex: '#4ea5d9',
    accentHex: '#7dd3fc',
    title: 'The Ancient Law',
    lore: 'The Strand weaves fate itself. They see all threads — past and future. Patient long-range bettors who play 20 chapters ahead.',
    strengths: ['Temporal oracle specialists', 'Long-range prediction edge', 'Lore mastery'],
    style: 'Patient. Prophetic. Long-game.',
  },
  {
    id: 'null',
    name: 'Null Collective',
    emoji: '💀',
    colorHex: '#ef4444',
    accentHex: '#fca5a5',
    title: 'The Broken Thread',
    lore: 'The Null Collective worships the Void. Chaos is their doctrine. They bet on the impossible, the heretical, the story-shattering choice.',
    strengths: ['High-variance high-reward bets', 'Chaos disruption wars', 'No rules play'],
    style: 'Chaotic. High-risk. Unpredictable.',
  },
]

const STEP_LABELS = ['Choose House', 'Name Your Guild', 'Review & Launch']

export function CreateGuildForm() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [step, setStep] = useState(0)
  const [selectedHouse, setSelectedHouse] = useState<HouseAlignment | null>(null)
  const [guildName, setGuildName] = useState('')
  const [guildTag, setGuildTag] = useState('')
  const [guildDesc, setGuildDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Validation
  const nameError =
    guildName.length > 0 && (guildName.length < 3 || guildName.length > 40)
      ? 'Name must be 3-40 characters'
      : null
  const tagError =
    guildTag.length > 0 && (guildTag.length < 2 || guildTag.length > 5)
      ? 'Tag must be 2-5 characters'
      : null
  const descError =
    guildDesc.length > 0 && guildDesc.length < 10
      ? 'Description must be at least 10 characters'
      : null

  const step2Valid =
    guildName.length >= 3 &&
    guildName.length <= 40 &&
    guildTag.length >= 2 &&
    guildTag.length <= 5 &&
    guildDesc.length >= 10

  async function handleSubmit() {
    if (!selectedHouse || !isConnected || !address) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guildName,
          tag: guildTag,
          description: guildDesc,
          house: selectedHouse,
          founderAddress: address,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setSubmitError(json.error ?? `Server error (${res.status})`)
        return
      }

      router.push(`/guilds/${json.guild.id}?created=1`)
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Failed to create guild'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const selectedHouseData = HOUSES.find((h) => h.id === selectedHouse)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/guilds"
          className="inline-flex items-center gap-1.5 text-void-400 hover:text-gold transition-colors text-sm font-ui mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Guilds
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-ui font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Innovation Cycle #52 — Faction War Engine
          </div>
          <h1 className="font-cinzel font-bold text-3xl text-foreground mb-2">
            Found a Guild
          </h1>
          <p className="text-void-400 text-sm font-body">
            Unite bettors under one banner. Control territory. Shape the
            narrative.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border
                  transition-all duration-300
                  ${i < step
                    ? 'bg-gold border-gold text-void-950'
                    : i === step
                    ? 'bg-gold/15 border-gold/60 text-gold'
                    : 'bg-void-900/40 border-void-700/30 text-void-600'}
                `}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-ui hidden sm:block ${
                  i === step ? 'text-gold' : 'text-void-500'
                }`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-8 h-px mx-1 ${
                    i < step ? 'bg-gold/50' : 'bg-void-700/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* ── Step 0: Choose House ── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-cinzel font-bold text-foreground text-lg mb-5 text-center">
                Choose Your House Alignment
              </h2>
              <div className="space-y-3">
                {HOUSES.map((house) => (
                  <button
                    key={house.id}
                    onClick={() => setSelectedHouse(house.id)}
                    className={`
                      w-full text-left rounded-xl border p-4 transition-all duration-200
                      ${selectedHouse === house.id
                        ? 'border-opacity-80 bg-opacity-10 shadow-lg'
                        : 'border-void-700/30 bg-void-900/30 hover:border-void-500/50 hover:bg-void-800/30'}
                    `}
                    style={
                      selectedHouse === house.id
                        ? {
                            borderColor: house.colorHex + 'cc',
                            backgroundColor: house.colorHex + '15',
                          }
                        : {}
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border"
                        style={{
                          backgroundColor: house.colorHex + '22',
                          borderColor: house.colorHex + '55',
                        }}
                      >
                        {house.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span
                              className="font-cinzel font-bold text-sm"
                              style={{ color: house.accentHex }}
                            >
                              {house.name}
                            </span>
                            <span className="text-void-500 text-xs font-ui ml-2">
                              — {house.title}
                            </span>
                          </div>
                          {selectedHouse === house.id && (
                            <Check
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: house.accentHex }}
                            />
                          )}
                        </div>

                        <p className="text-void-400 text-xs font-body mt-1 leading-relaxed">
                          {house.lore}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {house.strengths.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-ui px-2 py-0.5 rounded-full border"
                              style={{
                                color: house.colorHex,
                                borderColor: house.colorHex + '44',
                                backgroundColor: house.colorHex + '15',
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  disabled={!selectedHouse}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-ui font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={
                    selectedHouse
                      ? {
                          backgroundColor:
                            selectedHouseData?.colorHex + '22',
                          borderColor:
                            selectedHouseData?.colorHex + '66',
                          color: selectedHouseData?.accentHex,
                          border: '1px solid',
                        }
                      : {
                          backgroundColor: '#1e293b',
                          color: '#6e6e77',
                          border: '1px solid #334155',
                        }
                  }
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Name Guild ── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* House reminder */}
              {selectedHouseData && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border mb-6"
                  style={{
                    borderColor: selectedHouseData.colorHex + '44',
                    backgroundColor: selectedHouseData.colorHex + '10',
                  }}
                >
                  <span className="text-2xl">{selectedHouseData.emoji}</span>
                  <div>
                    <div
                      className="font-cinzel font-bold text-sm"
                      style={{ color: selectedHouseData.accentHex }}
                    >
                      {selectedHouseData.name}
                    </div>
                    <div className="text-void-400 text-xs font-ui">
                      {selectedHouseData.style}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Guild name */}
                <div>
                  <label className="block text-xs font-ui font-semibold text-void-300 mb-1.5">
                    Guild Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    placeholder="The Eternal Guard"
                    maxLength={40}
                    className="w-full px-4 py-3 rounded-xl bg-void-900/60 border border-void-700/40 text-foreground placeholder:text-void-600 font-ui focus:outline-none focus:border-gold/50 transition-colors"
                  />
                  <div className="flex justify-between mt-1">
                    {nameError ? (
                      <span className="text-error text-xs font-ui">
                        {nameError}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-void-600 text-xs font-mono">
                      {guildName.length}/40
                    </span>
                  </div>
                </div>

                {/* Guild tag */}
                <div>
                  <label className="block text-xs font-ui font-semibold text-void-300 mb-1.5">
                    Guild Tag <span className="text-error">*</span>
                    <span className="text-void-500 font-normal ml-1">
                      (2-5 chars, shown as [TAG])
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-void-400 font-mono text-sm">[</span>
                    <input
                      type="text"
                      value={guildTag}
                      onChange={(e) =>
                        setGuildTag(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                        )
                      }
                      placeholder="ETG"
                      maxLength={5}
                      className="w-24 px-3 py-3 rounded-xl bg-void-900/60 border border-void-700/40 text-foreground placeholder:text-void-600 font-mono text-center focus:outline-none focus:border-gold/50 transition-colors uppercase"
                    />
                    <span className="text-void-400 font-mono text-sm">]</span>
                  </div>
                  {tagError && (
                    <span className="text-error text-xs font-ui mt-1 block">
                      {tagError}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-ui font-semibold text-void-300 mb-1.5">
                    Guild Description <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={guildDesc}
                    onChange={(e) => setGuildDesc(e.target.value)}
                    placeholder="Tell potential members what your guild stands for. What's your betting philosophy? Who should join? What's your play style?"
                    maxLength={300}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-void-900/60 border border-void-700/40 text-foreground placeholder:text-void-600 font-body text-sm focus:outline-none focus:border-gold/50 transition-colors resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    {descError ? (
                      <span className="text-error text-xs font-ui">
                        {descError}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-void-600 text-xs font-mono">
                      {guildDesc.length}/300
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-void-700/40 text-void-400 hover:text-foreground hover:border-void-500 transition-all font-ui font-semibold text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!step2Valid}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-ui font-semibold text-sm bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Review & Submit ── */}
          {step === 2 && selectedHouseData && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-cinzel font-bold text-foreground text-lg mb-6 text-center">
                Review Your Guild
              </h2>

              {/* Preview card */}
              <div
                className="rounded-xl border p-6 mb-6"
                style={{
                  borderColor: selectedHouseData.colorHex + '66',
                  backgroundColor: selectedHouseData.colorHex + '0d',
                }}
              >
                {/* Color stripe */}
                <div
                  className="h-1 w-full rounded-full mb-4"
                  style={{ backgroundColor: selectedHouseData.colorHex }}
                />

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                    style={{
                      backgroundColor: selectedHouseData.colorHex + '22',
                      borderColor: selectedHouseData.colorHex + '55',
                    }}
                  >
                    {selectedHouseData.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-cinzel font-bold text-foreground">
                        {guildName || 'Your Guild Name'}
                      </h3>
                      <span className="font-mono text-void-500 text-xs">
                        [{guildTag || 'TAG'}]
                      </span>
                    </div>
                    <div
                      className="text-sm font-ui"
                      style={{ color: selectedHouseData.accentHex }}
                    >
                      {selectedHouseData.name} — {selectedHouseData.title}
                    </div>
                  </div>
                </div>

                <p className="text-void-300 text-sm font-body leading-relaxed mb-4">
                  {guildDesc}
                </p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-void-900/60 rounded-lg p-3">
                    <div className="text-lg font-mono font-bold text-gold">1</div>
                    <div className="text-void-500 text-xs font-ui">Members</div>
                  </div>
                  <div className="bg-void-900/60 rounded-lg p-3">
                    <div className="text-lg font-mono font-bold text-foreground">Ember</div>
                    <div className="text-void-500 text-xs font-ui">Tier</div>
                  </div>
                  <div className="bg-void-900/60 rounded-lg p-3">
                    <div className="text-lg font-mono font-bold text-void-300">0</div>
                    <div className="text-void-500 text-xs font-ui">Territory</div>
                  </div>
                </div>
              </div>

              {/* Wallet check */}
              {!isConnected ? (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/30 bg-warning/5 mb-5">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-ui font-semibold text-warning text-sm">
                      Wallet Required
                    </div>
                    <div className="text-void-400 text-xs font-body mt-0.5">
                      Connect your wallet to found a guild. Your address becomes
                      the guild founder.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-success/20 bg-success/5 mb-5">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-xs font-ui text-success font-semibold">
                    Wallet connected:
                  </span>
                  <span className="text-xs font-mono text-void-400">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-error/30 bg-error/5 mb-5">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-error text-sm font-ui">{submitError}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-void-700/40 text-void-400 hover:text-foreground hover:border-void-500 transition-all font-ui font-semibold text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!isConnected || submitting}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-lg font-ui font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={
                    isConnected && !submitting
                      ? {
                          backgroundColor: selectedHouseData.colorHex + '22',
                          borderColor: selectedHouseData.colorHex + '77',
                          color: selectedHouseData.accentHex,
                          border: '1px solid',
                          boxShadow: `0 0 20px ${selectedHouseData.colorHex}22`,
                        }
                      : {
                          backgroundColor: '#1e293b',
                          color: '#6e6e77',
                          border: '1px solid #334155',
                        }
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Founding Guild...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Found the Guild
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
