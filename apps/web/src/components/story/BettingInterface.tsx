'use client'

import { useState, useEffect, useMemo } from 'react'
import { BettingPool, Choice } from '@voidborne/database'
import { TrendingUp, Users, Clock, Trophy, AlertCircle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { usePlaceBet } from '@/hooks/usePlaceBet'
import { useUSDCBalance } from '@/hooks/useUSDCBalance'

interface BettingInterfaceProps {
  poolId: string
  contractAddress: `0x${string}`
  pool: BettingPool & { _count: { bets: number } }
  choices: (Choice & { _count: { bets: number } })[]
  onBetPlaced: () => void
}

export function BettingInterface({ poolId, contractAddress, pool, choices, onBetPlaced }: BettingInterfaceProps) {
  const { address, isConnected } = useAccount()
  const { balance, balanceRaw } = useUSDCBalance()
  const { placeBet, isApproving, isPlacing, needsApproval, error, resetError } = usePlaceBet(contractAddress)
  
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const closesAt = new Date(pool.closesAt)
      const diff = closesAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Closed')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [pool.closesAt])

  const isOpen = pool.status === 'OPEN' && new Date() < new Date(pool.closesAt)

  async function handlePlaceBet() {
    if (!selectedChoice || !betAmount || !address) return
    
    resetError()
    const amount = parseFloat(betAmount)
    
    // Validate amount
    if (amount < pool.minBet.toNumber()) {
      return
    }

    if (pool.maxBet && amount > pool.maxBet.toNumber()) {
      return
    }

    // Check balance
    if (amount > parseFloat(balance)) {
      return
    }

    try {
      // Place bet (handles approval if needed)
      const txHash = await placeBet(selectedChoice, amount, false) // isAgent = false
      
      // Record bet in database
      const response = await fetch('/api/betting/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          choiceId: choices[selectedChoice].id,
          walletAddress: address,
          amount,
          txHash,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record bet')
      }

      // Success!
      setBetAmount('')
      setSelectedChoice(null)
      onBetPlaced()
    } catch (err) {
      // Error is already surfaced via the `error` state from usePlaceBet hook
      if (process.env.NODE_ENV !== 'production') {
        console.error('Bet placement error:', err)
      }
    }
  }

  // Memoize odds/payout calculations to avoid re-running on every render
  const selectedBranchOdds = useMemo(() => {
    if (selectedChoice === null) return 0
    const choice = choices[selectedChoice]
    const totalPool = pool.totalPool.toNumber()
    const choiceBets = choice.totalBets.toNumber()
    return totalPool > 0 && choiceBets > 0 ? totalPool / choiceBets : 0
  }, [selectedChoice, choices, pool.totalPool])

  const estimatedPayout = useMemo(() => {
    if (selectedChoice === null || !betAmount) return '0.00'
    const choice = choices[selectedChoice]
    if (!choice) return '0.00'
    const amount = parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) return '0.00'
    const choiceBets = choice.totalBets.toNumber() + amount
    const totalPool = pool.totalPool.toNumber() + amount
    const winnerShare = totalPool * 0.85
    const payout = (amount / choiceBets) * winnerShare
    return payout.toFixed(2)
  }, [selectedChoice, betAmount, choices, pool.totalPool])

  return (
    <div className="glass-card rounded-2xl p-8">
      {/* Pool Header */}
      <div className="mb-8">
        <h3 className="text-3xl font-display font-bold text-gold mb-2">Place Your Bet</h3>
        <p className="text-void-300">
          Predict which branch the AI will choose
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4 bg-drift-teal/5 border border-drift-teal/20">
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Total Pool</span>
          </div>
          <div className="text-3xl font-display font-bold text-drift-teal tabular-nums">
            ${Number(pool.totalPool).toFixed(2)}
          </div>
          <div className="text-xs text-void-500 mt-1">USDC</div>
        </div>

        <div className="glass-card rounded-xl p-4 bg-gold/5 border border-gold/20">
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Bettors</span>
          </div>
          <div className="text-3xl font-display font-bold text-gold tabular-nums">
            {pool.uniqueBettors}
          </div>
          <div className="text-xs text-void-500 mt-1">Active</div>
        </div>
      </div>

      {/* Countdown */}
      {isOpen && (
        <div className="mb-8 p-6 glass-card rounded-xl border border-gold/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gold/10 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <span className="font-ui font-semibold text-foreground">Betting closes in:</span>
            </div>
            <div className="text-3xl font-display font-bold text-gold tabular-nums">{timeLeft}</div>
          </div>
        </div>
      )}

      {/* Choices */}
      <div className="mb-8 space-y-4">
        <h4 className="font-display font-semibold text-lg text-gold mb-4">Choose Your Path:</h4>
        {choices.map((choice, index) => {
          const totalPool = pool.totalPool.toNumber()
          const choiceBets = choice.totalBets.toNumber()
          const percentage = totalPool > 0 ? (choiceBets / totalPool) * 100 : 0
          const odds = totalPool > 0 && choiceBets > 0 ? totalPool / choiceBets : 0
          const isSelected = selectedChoice === index

          return (
            <motion.button
              key={choice.id}
              onClick={() => isOpen && isConnected && setSelectedChoice(index)}
              disabled={!isOpen || !isConnected}
              whileHover={isOpen && isConnected ? { scale: 1.01 } : {}}
              whileTap={isOpen && isConnected ? { scale: 0.99 } : {}}
              className={`w-full glass-card p-6 rounded-xl transition-all duration-500 ${
                isSelected
                  ? 'border-2 border-gold bg-gold/10'
                  : 'border border-void-800 hover:border-gold/50'
              } ${(!isOpen || !isConnected) && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1 text-left">
                  <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${
                    isSelected ? 'border-gold bg-gold' : 'border-void-600'
                  }`}>
                    {isSelected && <div className="w-3 h-3 bg-background rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-ui font-semibold text-foreground mb-2">{choice.text}</div>
                    {choice.description && (
                      <div className="text-sm text-void-400 leading-relaxed">{choice.description}</div>
                    )}
                  </div>
                </div>
                {odds > 0 && (
                  <div className="text-right ml-6">
                    <div className="text-xs text-void-500 font-ui uppercase tracking-wider mb-1">Odds</div>
                    <div className="text-2xl font-display font-bold text-drift-teal tabular-nums">{odds.toFixed(2)}x</div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-void-900 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-void-500 font-ui">
                <span>{choice._count.bets} bets</span>
                <span className="tabular-nums">{percentage.toFixed(1)}% of pool</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Bet Amount Input */}
      {isOpen && isConnected && (
        <div className="mb-8">
          <label className="block text-sm font-ui font-semibold text-void-300 mb-3">
            Bet Amount (USDC)
          </label>
          <div className="relative">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder={`Min: $${Number(pool.minBet).toFixed(2)}`}
              min={Number(pool.minBet)}
              max={pool.maxBet ? Number(pool.maxBet) : undefined}
              step="1"
              aria-label="Bet amount in USDC"
              aria-describedby="bet-amount-hint"
              className="w-full px-6 py-4 pl-12 glass-card rounded-xl border border-void-800 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-500 font-ui text-lg tabular-nums"
            />
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-drift-teal" />
          </div>
          <div id="bet-amount-hint" className="flex justify-between mt-3 text-xs text-void-500 font-ui">
            <span>Min: ${Number(pool.minBet).toFixed(2)}</span>
            <span>Balance: ${balance}</span>
            {pool.maxBet && <span>Max: ${Number(pool.maxBet).toFixed(2)}</span>}
          </div>
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 glass-card rounded-xl border border-error/30 bg-error/10 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <span className="text-sm text-error font-ui">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place Bet Button */}
      {!isConnected ? (
        <div className="p-6 glass-card rounded-xl border border-void-800 text-center">
          <p className="text-void-400 font-ui">Connect your wallet to place a bet</p>
        </div>
      ) : !isOpen ? (
        <div className="p-6 glass-card rounded-xl border border-void-800 text-center">
          <p className="text-void-400 font-ui">
            {pool.status === 'CLOSED' || pool.status === 'RESOLVING'
              ? 'Betting closed - AI is deciding...'
              : pool.status === 'RESOLVED'
              ? 'Betting resolved - Winner chosen!'
              : 'Betting not yet open'}
          </p>
        </div>
      ) : (
        <Button
          onClick={handlePlaceBet}
          disabled={!selectedChoice || !betAmount || isApproving || isPlacing}
          className="w-full btn-primary text-lg py-6 font-ui font-bold"
        >
          {isApproving ? (
            <>
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
              Approving USDC...
            </>
          ) : isPlacing ? (
            <>
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
              Placing Bet...
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5 mr-2" />
              {needsApproval ? 'Approve & Place Bet' : 'Place Bet'}
            </>
          )}
        </Button>
      )}

      {/* Payout Info */}
      {selectedChoice !== null && betAmount && isOpen && isConnected && (
        <div className="mt-6 p-6 glass-card rounded-xl border border-success/30 bg-success/5">
          <div className="text-sm text-void-400 font-ui uppercase tracking-wider mb-2">Potential Payout:</div>
          <div className="text-4xl font-display font-bold text-success tabular-nums">
            ${estimatedPayout}
          </div>
          <div className="text-xs text-void-500 mt-2 font-ui">
            If your choice wins (85% pool to winners • {selectedBranchOdds.toFixed(2)}x odds)
          </div>
        </div>
      )}
    </div>
  )
}
