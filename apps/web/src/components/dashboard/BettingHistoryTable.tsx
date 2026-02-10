'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Bet = {
  id: string
  poolId: string
  amount: number
  odds: number
  status: 'PENDING' | 'WON' | 'LOST'
  payout: number | null
  profit: number | null
  createdAt: Date
  story: {
    id: string
    title: string
  }
  chapter: {
    number: number
    title: string
  }
  choice: {
    text: string
    isChosen: boolean | null
  }
}

type BettingHistoryResponse = {
  bets: Bet[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  timestamp: string
}

interface BettingHistoryTableProps {
  walletAddress: string
  timeframe: string
}

export function BettingHistoryTable({ walletAddress, timeframe }: BettingHistoryTableProps) {
  const [bets, setBets] = useState<Bet[]>([])
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')

  useEffect(() => {
    fetchBets()
  }, [walletAddress, timeframe, statusFilter, pagination.offset])

  async function fetchBets() {
    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/users/${walletAddress}/bets?status=${statusFilter}&timeframe=${timeframe}&limit=20&offset=${pagination.offset}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch bets')

      const data: BettingHistoryResponse = await response.json()
      setBets(data.bets)
      setPagination(data.pagination)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch betting history:', err)
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
            Won
          </span>
        )
      case 'LOST':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
            Lost
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-drift-teal/10 text-drift-teal border border-drift-teal/20">
            Pending
          </span>
        )
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-cinzel font-bold text-gold mb-2">
            Betting History
          </h2>
          <p className="text-foreground/70">
            {pagination.total} total bets
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'pending', 'won', 'lost'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPagination((prev) => ({ ...prev, offset: 0 }))
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                statusFilter === status
                  ? 'bg-gold text-void-950'
                  : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-void-400">Loading bets...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-void-600 mx-auto mb-4" />
          <p className="text-void-400 mb-2">No bets found</p>
          <Link href="/" className="text-gold hover:text-gold/80 text-sm">
            Place your first bet →
          </Link>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    Story
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    Choice
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    Bet
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    Odds
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-ui font-semibold text-void-400">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet, index) => (
                  <motion.tr
                    key={bet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-void-800/50 hover:bg-void-900/30 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-4 px-4">
                      <div className="text-sm text-foreground">
                        {new Date(bet.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-void-500">
                        {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                      </div>
                    </td>

                    {/* Story */}
                    <td className="py-4 px-4">
                      <Link href={`/story/${bet.story.id}`}>
                        <div className="text-sm text-gold hover:text-gold/80 transition-colors cursor-pointer truncate max-w-[200px]">
                          {bet.story.title}
                        </div>
                        <div className="text-xs text-void-500">Ch {bet.chapter.number}</div>
                      </Link>
                    </td>

                    {/* Choice */}
                    <td className="py-4 px-4">
                      <div className="text-sm text-foreground truncate max-w-[250px]">
                        {bet.choice.text}
                      </div>
                    </td>

                    {/* Bet Amount */}
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-mono tabular-nums text-foreground">
                        {formatCurrency(bet.amount)}
                      </div>
                    </td>

                    {/* Odds */}
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-mono tabular-nums text-drift-teal">
                        {bet.odds.toFixed(2)}x
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(bet.status)}
                    </td>

                    {/* Profit/Loss */}
                    <td className="py-4 px-4 text-right">
                      {bet.profit !== null ? (
                        <div
                          className={`text-sm font-mono tabular-nums font-bold ${
                            bet.profit >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {bet.profit >= 0 ? '+' : ''}
                          {formatCurrency(bet.profit)}
                        </div>
                      ) : (
                        <div className="text-sm text-void-500">—</div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gold/10">
              <div className="text-sm text-void-400">
                Showing {pagination.offset + 1}-
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      offset: Math.max(0, prev.offset - prev.limit),
                    }))
                  }
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 glass-card rounded-lg border border-void-800 hover:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      offset: prev.offset + prev.limit,
                    }))
                  }
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 glass-card rounded-lg border border-void-800 hover:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
