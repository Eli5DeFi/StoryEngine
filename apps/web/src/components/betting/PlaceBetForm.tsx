'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { BETTING_POOL_ADDRESS, BETTING_POOL_ABI, USDC_ADDRESS, ERC20_ABI } from '@/lib/contracts'
import { BettingCountdown } from './BettingCountdown'
import { BettingStatusBadge } from './BettingStatusBadge'

interface Outcome {
  id: number
  outcomeId: number
  description: string
  chapterId: number
  odds: bigint
}

interface PlaceBetFormProps {
  chapterId: number
  outcomes: Outcome[]
}

enum BetType {
  PARLAY = 0,
  TEASER = 1,
  ROUND_ROBIN = 2,
  PROGRESSIVE = 3,
}

export function PlaceBetForm({ chapterId, outcomes }: PlaceBetFormProps) {
  const { address, isConnected } = useAccount()
  const [selectedOutcomes, setSelectedOutcomes] = useState<number[]>([])
  const [amount, setAmount] = useState('')
  const [betType, setBetType] = useState<BetType>(BetType.PARLAY)
  const [step, setStep] = useState<'select' | 'approve' | 'bet'>('select')

  // Check if betting is open
  const { data: isOpen } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'isBettingOpen',
    args: [BigInt(chapterId)],
    query: {
      refetchInterval: 10_000,
    },
  })

  // Calculate combined odds
  const { data: combinedOdds } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'calculateCombinedOdds',
    args: [selectedOutcomes.map(id => BigInt(id))],
    query: {
      enabled: selectedOutcomes.length >= 2,
    },
  })

  // USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  // Approve USDC
  const { writeContract: approveUsdc, data: approveHash } = useWriteContract()
  const { isLoading: isApproving, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Place bet
  const { writeContract: placeBet, data: betHash, error: betError } = useWriteContract()
  const { isLoading: isPlacingBet, isSuccess: betPlaced } = useWaitForTransactionReceipt({
    hash: betHash,
  })

  // Reset form after successful bet
  useEffect(() => {
    if (betPlaced) {
      setSelectedOutcomes([])
      setAmount('')
      setStep('select')
    }
  }, [betPlaced])

  // Handle outcome selection
  const toggleOutcome = (outcomeId: number) => {
    setSelectedOutcomes(prev => 
      prev.includes(outcomeId)
        ? prev.filter(id => id !== outcomeId)
        : [...prev, outcomeId]
    )
  }

  // Handle approve
  const handleApprove = async () => {
    if (!amount || !address) return

    const amountBigInt = parseUnits(amount, 6) // USDC has 6 decimals

    approveUsdc({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [BETTING_POOL_ADDRESS, amountBigInt],
    })
  }

  // Handle place bet
  const handlePlaceBet = async () => {
    if (!amount || selectedOutcomes.length < 2) return

    const amountBigInt = parseUnits(amount, 6)

    placeBet({
      address: BETTING_POOL_ADDRESS,
      abi: BETTING_POOL_ABI,
      functionName: 'placeCombiBet',
      args: [
        selectedOutcomes.map(id => BigInt(id)),
        amountBigInt,
        betType,
      ],
    })
  }

  // Calculate potential payout
  const potentialPayout = combinedOdds && amount
    ? (parseFloat(amount) * Number(combinedOdds)) / 1e18
    : 0

  if (!isConnected) {
    return (
      <div 
        className="rounded-[14px] p-8 text-center"
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(100, 116, 139, 0.2)',
        }}
      >
        <h3 className="font-display text-xl font-bold text-[#F1F5F9] mb-2">
          Connect Wallet
        </h3>
        <p className="text-[#94A3B8]">
          Connect your wallet to place bets
        </p>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div 
        className="rounded-[14px] p-8 text-center"
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
        }}
      >
        <span className="text-6xl mb-4 block">🔒</span>
        <h3 className="font-display text-2xl font-bold text-[#F1F5F9] mb-2">
          Betting Closed
        </h3>
        <p className="text-[#94A3B8] mb-4">
          The betting window for this chapter has ended.
        </p>
        <p className="text-sm text-[#64748B]">
          Story generation is in progress. Check back soon for results!
        </p>
      </div>
    )
  }

  return (
    <div 
      className="rounded-[14px] p-6"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-2xl font-bold text-[#F1F5F9]">
            Place Your Bet
          </h3>
          <BettingStatusBadge chapterId={chapterId} size="sm" />
        </div>
        <BettingCountdown chapterId={chapterId} className="mb-4" />
      </div>

      {/* Outcome Selection */}
      <div className="mb-6">
        <label 
          className="block text-xs uppercase tracking-[2px] text-[#64748B] mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Select Outcomes (Min 2)
        </label>
        <div className="space-y-2" role="group" aria-label="Select outcomes to bet on">
          {outcomes.map((outcome) => (
            <button
              key={outcome.outcomeId}
              onClick={() => toggleOutcome(outcome.outcomeId)}
              aria-pressed={selectedOutcomes.includes(outcome.outcomeId)}
              aria-label={`${outcome.description} — ${outcome.odds ? (Number(outcome.odds) / 1e18).toFixed(2) : '—'}x odds`}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                selectedOutcomes.includes(outcome.outcomeId)
                  ? 'ring-2 ring-[#6366F1]'
                  : ''
              }`}
              style={{
                background: selectedOutcomes.includes(outcome.outcomeId)
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(15, 23, 42, 0.5)',
                border: `1px solid ${
                  selectedOutcomes.includes(outcome.outcomeId)
                    ? 'rgba(99, 102, 241, 0.4)'
                    : 'rgba(100, 116, 139, 0.2)'
                }`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#F1F5F9]">
                  {outcome.description}
                </span>
                <span className="font-display font-bold text-[#6366F1]">
                  {outcome.odds ? (Number(outcome.odds) / 1e18).toFixed(2) : '—'}x
                </span>
              </div>
              <div 
                className="text-xs text-[#64748B]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                OUTCOME #{outcome.outcomeId}
              </div>
            </button>
          ))}
        </div>
        {selectedOutcomes.length === 1 && (
          <p className="text-xs text-[#F59E0B] mt-2">
            ⚠️ Select at least 2 outcomes for a combinatorial bet
          </p>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label
          htmlFor="bet-amount"
          className="block text-xs uppercase tracking-[2px] text-[#64748B] mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Bet Amount (USDC)
        </label>
        <input
          id="bet-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          min="0"
          step="1"
          aria-label="Bet amount in USDC"
          aria-describedby="bet-amount-balance"
          className="w-full px-4 py-3 rounded-lg font-display text-lg text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
          }}
        />
        {usdcBalance && (
          <p id="bet-amount-balance" className="text-xs text-[#64748B] mt-2">
            Balance: {formatUnits(usdcBalance as bigint, 6)} USDC
          </p>
        )}
      </div>

      {/* Bet Type Selection */}
      <div className="mb-6">
        <label 
          className="block text-xs uppercase tracking-[2px] text-[#64748B] mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Bet Type
        </label>
        <select
          value={betType}
          onChange={(e) => setBetType(Number(e.target.value) as BetType)}
          className="w-full px-4 py-3 rounded-lg font-medium text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
          }}
        >
          <option value={BetType.PARLAY}>Parlay (All must win)</option>
          <option value={BetType.TEASER}>Teaser (Adjusted odds)</option>
          <option value={BetType.ROUND_ROBIN}>Round Robin</option>
          <option value={BetType.PROGRESSIVE}>Progressive</option>
        </select>
      </div>

      {/* Payout Display */}
      {selectedOutcomes.length >= 2 && amount && combinedOdds && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#94A3B8]">Combined Odds:</span>
            <span className="font-display font-bold text-xl text-[#6366F1]">
              {(Number(combinedOdds) / 1e18).toFixed(2)}x
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#94A3B8]">Potential Payout:</span>
            <span className="font-display font-bold text-xl text-[#22C55E]">
              ${potentialPayout.toFixed(2)} USDC
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            After 5% platform fee
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {step === 'select' && (
          <button
            onClick={handleApprove}
            disabled={selectedOutcomes.length < 2 || !amount}
            className="w-full px-6 py-4 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            style={{
              background: selectedOutcomes.length >= 2 && amount
                ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                : 'rgba(100, 116, 139, 0.3)',
            }}
          >
            {isApproving ? 'Approving...' : 'Approve USDC'}
          </button>
        )}

        {isApproved && (
          <button
            onClick={handlePlaceBet}
            disabled={isPlacingBet}
            className="w-full px-6 py-4 rounded-lg font-bold text-white transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
            }}
          >
            {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
          </button>
        )}

        {betPlaced && (
          <div 
            className="p-4 rounded-lg text-center"
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
            }}
          >
            <span className="text-2xl mb-2 block">✅</span>
            <p className="font-bold text-[#22C55E]">Bet Placed Successfully!</p>
          </div>
        )}

        {betError && (
          <div 
            className="p-4 rounded-lg text-center"
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
            }}
          >
            <p className="font-bold text-[#DC2626]">
              Error: {betError.message.includes('BettingClosed') 
                ? 'Betting deadline has passed' 
                : 'Transaction failed'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
