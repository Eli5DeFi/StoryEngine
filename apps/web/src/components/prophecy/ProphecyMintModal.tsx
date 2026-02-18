'use client'

/**
 * ProphecyMintModal
 * Full-screen modal for minting prophecy NFTs.
 * Supports single mint and Oracle Pack (up to 20, 10% discount).
 *
 * Flow:
 *   1. View prophecy teaser
 *   2. Select single or oracle pack
 *   3. Connect wallet (if needed)
 *   4. Confirm & mint → API call → success animation
 */

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ProphecyRarityBadge, deriveRarity } from './ProphecyRarityBadge'
import type { ProphecyData } from './ProphecyCard'

interface Props {
  prophecy: ProphecyData
  isOpen: boolean
  onClose: () => void
  onMintSuccess: (mintOrder: number) => void
  // Other pending prophecies for oracle pack
  relatedProphecies?: ProphecyData[]
}

type Step = 'preview' | 'confirm' | 'minting' | 'success' | 'error'

export function ProphecyMintModal({
  prophecy,
  isOpen,
  onClose,
  onMintSuccess,
  relatedProphecies = [],
}: Props) {
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<Step>('preview')
  const [isOraclePack, setIsOraclePack] = useState(false)
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([prophecy.id])
  const [mintResult, setMintResult] = useState<{ mintOrder: number; totalForgePaid: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const availableForPack = relatedProphecies.filter(
    (p) => p.status === 'PENDING' && p.spotsRemaining > 0 && !p.userMint
  )

  const forgeCost = isOraclePack
    ? (selectedPackIds.length * 5 * 0.9).toFixed(1)
    : '5.0'

  const rarity = deriveRarity(prophecy.status)

  const togglePackSelection = useCallback((id: string) => {
    setSelectedPackIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const handleMint = async () => {
    if (!isConnected || !address) return
    setStep('minting')
    setErrorMsg(null)

    try {
      const body = isOraclePack
        ? { prophecyIds: selectedPackIds, walletAddress: address }
        : { prophecyId: prophecy.id, walletAddress: address }

      const res = await fetch('/api/prophecies/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Mint failed')
      }

      // Find our prophecy's mint order from the result
      const ourMint = data.mints?.find(
        (m: { prophecy: { id: string }; mintOrder: number }) => m.prophecy?.id === prophecy.id
      )
      const mintOrder = ourMint?.mintOrder ?? 1

      setMintResult({ mintOrder, totalForgePaid: data.totalForgePaid })
      setStep('success')
      onMintSuccess(mintOrder)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('preview')
    setIsOraclePack(false)
    setSelectedPackIds([prophecy.id])
    setMintResult(null)
    setErrorMsg(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prophecy-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-void-950/90 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-void-700/50 bg-gradient-to-br from-void-950 via-[#0c0c1a] to-void-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-void-800/40">
          <div>
            <h2
              id="prophecy-modal-title"
              className="text-lg text-void-100"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              {step === 'success' ? 'Prophecy Sealed ✦' : 'Mint Prophecy NFT'}
            </h2>
            <p className="text-xs text-void-500 font-mono mt-0.5">
              Ch.{prophecy.chapter.chapterNumber} — {prophecy.chapter.story.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-void-600 hover:text-void-400 transition-colors text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* PREVIEW / CONFIRM */}
          {(step === 'preview' || step === 'confirm') && (
            <>
              {/* Prophecy teaser */}
              <div className="rounded-lg border border-void-700/30 bg-void-950/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ProphecyRarityBadge rarity={rarity} size="sm" />
                  <span className="text-[11px] font-mono text-void-500">
                    #{prophecy.mintedCount + 1} of {prophecy.maxSupply}
                  </span>
                </div>
                <p
                  className="text-sm text-void-300 italic leading-relaxed"
                  style={{ fontFamily: 'var(--font-cinzel)' }}
                >
                  &ldquo;{prophecy.teaser}&rdquo;
                </p>
                <p className="text-[11px] text-void-600 font-mono mt-2">
                  ▓▓▓ full text sealed until chapter closes ▓▓▓
                </p>
              </div>

              {/* Fulfillment reward table */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono text-void-500 uppercase tracking-widest">
                  Potential rewards
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '★ Fulfilled', multiplier: '10×', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
                    { label: '◈ Echoed', multiplier: '3×', color: 'text-slate-300', bg: 'bg-slate-500/5 border-slate-500/20' },
                    { label: '▪ Void Relic', multiplier: '1×', color: 'text-void-500', bg: 'bg-void-800/20 border-void-700/20' },
                  ].map((tier) => (
                    <div key={tier.label} className={`rounded border p-2 text-center ${tier.bg}`}>
                      <div className={`text-xs font-mono ${tier.color}`}>{tier.label}</div>
                      <div className={`text-lg font-bold ${tier.color}`}>{tier.multiplier}</div>
                      <div className="text-[10px] text-void-600">value</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oracle Pack toggle */}
              {availableForPack.length > 0 && (
                <div>
                  <button
                    onClick={() => setIsOraclePack((v) => !v)}
                    className={[
                      'w-full flex items-center justify-between px-4 py-2.5 rounded border',
                      'text-xs font-mono transition-all duration-200',
                      isOraclePack
                        ? 'border-amber-500/40 bg-amber-500/5 text-amber-300'
                        : 'border-void-700/30 bg-void-900/40 text-void-400 hover:border-void-600/50',
                    ].join(' ')}
                  >
                    <span>⊕ Oracle Pack (10% discount)</span>
                    <span>{isOraclePack ? '▲ collapse' : '▼ expand'}</span>
                  </button>

                  {isOraclePack && (
                    <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto rounded border border-void-800/30 p-3">
                      {availableForPack.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPackIds.includes(p.id)}
                            onChange={() => togglePackSelection(p.id)}
                            className="accent-amber-500"
                          />
                          <span className="text-xs text-void-300 group-hover:text-void-200 truncate">
                            {p.teaser}
                          </span>
                          <span className="ml-auto text-[10px] text-void-600 shrink-0">
                            {p.spotsRemaining} left
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cost summary */}
              <div className="flex items-center justify-between text-sm border-t border-void-800/30 pt-4">
                <span className="text-void-400 font-mono">Cost</span>
                <div className="text-right">
                  <span className="text-amber-300 font-mono font-bold">{forgeCost} $FORGE</span>
                  {isOraclePack && (
                    <div className="text-[10px] text-void-500 font-mono">
                      {selectedPackIds.length} prophecies × 4.5 $FORGE
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              {!isConnected ? (
                <div className="text-center text-sm text-void-400 py-2 border border-void-700/30 rounded bg-void-900/40">
                  Connect wallet to mint
                </div>
              ) : (
                <button
                  onClick={() => setStep('confirm')}
                  className={[
                    'w-full py-3 rounded border font-mono text-sm uppercase tracking-widest',
                    'border-amber-500/40 bg-amber-500/5 text-amber-300',
                    'hover:bg-amber-500/10 hover:border-amber-400/60',
                    'transition-all duration-200',
                  ].join(' ')}
                >
                  {step === 'preview' ? 'Preview Mint' : 'Confirm — Mint Now'}
                </button>
              )}

              {step === 'confirm' && (
                <button
                  onClick={handleMint}
                  className={[
                    'w-full py-3 rounded border font-mono text-sm uppercase tracking-widest',
                    'border-amber-500/60 bg-amber-500/10 text-amber-200',
                    'hover:bg-amber-500/20',
                    'transition-all duration-200',
                  ].join(' ')}
                >
                  ✦ Seal the Prophecy — {forgeCost} $FORGE
                </button>
              )}
            </>
          )}

          {/* MINTING */}
          {step === 'minting' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-4xl animate-spin">⌭</div>
              <p className="text-void-300 font-mono">Sealing prophecy on-chain…</p>
              <p className="text-[11px] text-void-600 font-mono">
                Your NFT is being minted. This may take a moment.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && mintResult && (
            <div className="text-center py-6 space-y-4">
              <div
                className="text-5xl"
                style={{ filter: 'drop-shadow(0 0 16px rgba(212,168,83,0.4))' }}
              >
                ✦
              </div>
              <div>
                <p
                  className="text-lg text-amber-300"
                  style={{ fontFamily: 'var(--font-cinzel)' }}
                >
                  Prophecy Sealed
                </p>
                <p className="text-sm text-void-400 font-mono mt-1">
                  Mint #{mintResult.mintOrder} of {prophecy.maxSupply}
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm space-y-1">
                <div className="flex justify-between text-void-300">
                  <span>$FORGE spent</span>
                  <span className="text-amber-300 font-mono">{mintResult.totalForgePaid}</span>
                </div>
                <div className="flex justify-between text-void-300">
                  <span>Your mint rank</span>
                  <span className="text-amber-300 font-mono">
                    #{mintResult.mintOrder} {mintResult.mintOrder <= 5 ? '(Mythic tier!)' : mintResult.mintOrder <= 10 ? '(Rare tier)' : ''}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-void-500 font-mono">
                Your prophecy will transform when the chapter resolves.
                <br />Watch for the golden glow if it comes true.
              </p>

              <button
                onClick={handleClose}
                className="text-xs font-mono text-void-500 hover:text-void-300 underline transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="text-4xl text-red-500">⊗</div>
              <p className="text-red-400 font-mono text-sm">{errorMsg ?? 'Mint failed'}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('preview')}
                  className="flex-1 py-2 rounded border border-void-600 text-void-300 font-mono text-xs hover:border-void-500 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 rounded border border-void-700 text-void-500 font-mono text-xs hover:border-void-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
