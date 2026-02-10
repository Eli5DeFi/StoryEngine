'use client'

import { useState, useEffect } from 'react'
import { BettingPool, Choice } from '@narrative-forge/database'
import { TrendingUp, Users, Clock, Trophy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface BettingInterfaceProps {
  pool: BettingPool & { _count: { bets: number } }
  choices: (Choice & { _count: { bets: number } })[]
  onBetPlaced: () => void
}

export function BettingInterface({ pool, choices, onBetPlaced }: BettingInterfaceProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    if (!selectedChoice || !betAmount) {
      setError('Please select a choice and enter an amount')
      return
    }

    const amount = parseFloat(betAmount)
    if (amount < pool.minBet.toNumber()) {
      setError(`Minimum bet is ${pool.minBet} FORGE`)
      return
    }

    if (pool.maxBet && amount > pool.maxBet.toNumber()) {
      setError(`Maximum bet is ${pool.maxBet} FORGE`)
      return
    }

    setPlacing(true)
    setError(null)

    try {
      // TODO: Get user wallet address from auth context
      const walletAddress = '0x1234567890123456789012345678901234567890'
      
      // Get or create user
      const userRes = await fetch(`/api/users/${walletAddress}`)
      const user = await userRes.json()

      // TODO: Submit transaction to blockchain first
      const txHash = '0xplaceholder' // Replace with actual tx hash

      // Record bet in database
      const response = await fetch('/api/betting/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: pool.id,
          choiceId: selectedChoice,
          userId: user.id,
          amount,
          txHash,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place bet')
      }

      // Success!
      setBetAmount('')
      setSelectedChoice(null)
      onBetPlaced()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      {/* Pool Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Place Your Bet</h3>
        <p className="text-sm text-foreground/70">
          Predict which choice the AI will make
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-foreground/60">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Total Pool</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {pool.totalPool.toString()} <span className="text-sm text-foreground/60">FORGE</span>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-foreground/60">
            <Users className="w-4 h-4" />
            <span className="text-xs">Bettors</span>
          </div>
          <div className="text-2xl font-bold">{pool.uniqueBettors}</div>
        </div>
      </div>

      {/* Countdown */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium">Betting closes in:</span>
          </div>
          <div className="text-2xl font-bold text-primary">{timeLeft}</div>
        </div>
      </div>

      {/* Choices */}
      <div className="mb-6 space-y-3">
        <h4 className="font-semibold mb-3">Choose Your Path:</h4>
        {choices.map((choice) => {
          const totalPool = pool.totalPool.toNumber()
          const choiceBets = choice.totalBets.toNumber()
          const percentage = totalPool > 0 ? (choiceBets / totalPool) * 100 : 0
          const odds = totalPool > 0 && choiceBets > 0 ? totalPool / choiceBets : 0
          const isSelected = selectedChoice === choice.id

          return (
            <motion.button
              key={choice.id}
              onClick={() => isOpen && setSelectedChoice(choice.id)}
              disabled={!isOpen}
              whileHover={isOpen ? { scale: 1.02 } : {}}
              whileTap={isOpen ? { scale: 0.98 } : {}}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:border-primary/50'
              } ${!isOpen && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 text-left">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{choice.text}</div>
                    {choice.description && (
                      <div className="text-sm text-foreground/60">{choice.description}</div>
                    )}
                  </div>
                </div>
                {odds > 0 && (
                  <div className="text-right ml-4">
                    <div className="text-sm text-foreground/60">Odds</div>
                    <div className="font-bold text-primary">{odds.toFixed(2)}x</div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-foreground/60">
                <span>{choice._count.bets} bets</span>
                <span>{percentage.toFixed(1)}% of pool</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Bet Amount Input */}
      {isOpen && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Bet Amount (FORGE)
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder={`Min: ${pool.minBet}`}
            min={pool.minBet.toNumber()}
            max={pool.maxBet?.toNumber()}
            step="0.001"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-between mt-2 text-xs text-foreground/60">
            <span>Min: {pool.minBet.toString()} FORGE</span>
            {pool.maxBet && <span>Max: {pool.maxBet.toString()} FORGE</span>}
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
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-500">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place Bet Button */}
      {isOpen ? (
        <Button
          onClick={handlePlaceBet}
          disabled={!selectedChoice || !betAmount || placing}
          className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
        >
          {placing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Placing Bet...
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5 mr-2" />
              Place Bet
            </>
          )}
        </Button>
      ) : (
        <div className="p-4 bg-foreground/5 border border-border rounded-lg text-center">
          <p className="text-foreground/70">
            {pool.status === 'CLOSED' || pool.status === 'RESOLVING'
              ? 'Betting closed - AI is deciding...'
              : pool.status === 'RESOLVED'
              ? 'Betting resolved - Winner chosen!'
              : 'Betting not yet open'}
          </p>
        </div>
      )}

      {/* Payout Info */}
      {selectedChoice && betAmount && isOpen && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
          <div className="text-sm text-foreground/70 mb-1">Potential Payout:</div>
          <div className="text-2xl font-bold text-green-500">
            {(() => {
              const choice = choices.find((c) => c.id === selectedChoice)
              if (!choice) return '0'
              const amount = parseFloat(betAmount)
              const choiceBets = choice.totalBets.toNumber() + amount
              const totalPool = pool.totalPool.toNumber() + amount
              const winnerShare = totalPool * 0.85
              const payout = (amount / choiceBets) * winnerShare
              return payout.toFixed(3)
            })()}{' '}
            FORGE
          </div>
          <div className="text-xs text-foreground/60 mt-1">
            If your choice wins (85% pool to winners)
          </div>
        </div>
      )}
    </div>
  )
}
