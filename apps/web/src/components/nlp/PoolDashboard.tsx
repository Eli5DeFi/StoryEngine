/**
 * Pool Dashboard Component
 * 
 * Displays real-time pool state, reserves, prices, and liquidity depth.
 * Shows price matrix for all outcome pairs.
 * 
 * @author Voidborne Team (Innovation Cycle #46)
 * @version 1.0.0
 */

'use client';

import { usePoolState, useLPPositions } from '@/hooks/useNLP';
import { TrendingUpIcon, DropletIcon, RefreshCwIcon } from 'lucide-react';

interface PoolDashboardProps {
  chapterId: number;
  outcomes: Array<{ id: number; text: string; color?: string }>;
}

export function PoolDashboard({ chapterId, outcomes }: PoolDashboardProps) {
  const { poolState, loading, error, refetch } = usePoolState(chapterId, outcomes.length);
  const { positions } = useLPPositions(chapterId, outcomes.length);

  if (loading && !poolState) {
    return (
      <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-8 text-center">
        <RefreshCwIcon className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
        <p className="text-white/70">Loading pool state...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-void-purple/30 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center">
        <p className="text-red-400">Error loading pool state</p>
        <button
          onClick={refetch}
          className="mt-4 text-drift-teal hover:text-drift-teal/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!poolState) return null;

  const totalLiquidity = poolState.reserves.reduce(
    (sum, reserve) => sum + parseFloat(reserve),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-cinzel text-gold flex items-center gap-2">
            <DropletIcon className="w-6 h-6" />
            Liquidity Pools
          </h2>
          <button
            onClick={refetch}
            className="text-drift-teal hover:text-drift-teal/80 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCwIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Total Liquidity */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-void-purple/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
              Total Liquidity
            </p>
            <p className="text-2xl font-space-grotesk text-white">
              ${totalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-void-purple/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
              Your Positions
            </p>
            <p className="text-2xl font-space-grotesk text-drift-teal">
              {positions.length}
            </p>
          </div>
        </div>

        {/* Pool Reserves */}
        <div className="space-y-3">
          {outcomes.map((outcome, idx) => {
            const reserve = parseFloat(poolState.reserves[idx] || '0');
            const percentage = totalLiquidity > 0 ? (reserve / totalLiquidity) * 100 : 0;
            const userPosition = positions.find((p) => p.outcomeId === outcome.id);

            return (
              <div
                key={outcome.id}
                className="bg-void-purple/50 border border-white/10 rounded-xl p-4 hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: outcome.color || '#d4a853' }}
                    />
                    <span className="font-space-grotesk text-white">
                      {outcome.text}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-white">
                      ${reserve.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-white/50">{percentage.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-void-purple/70 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: outcome.color || '#d4a853',
                    }}
                  />
                </div>

                {/* User Position */}
                {userPosition && (
                  <div className="mt-3 flex items-center justify-between text-xs text-drift-teal">
                    <span>Your LP:</span>
                    <span className="font-mono">
                      {parseFloat(userPosition.lpBalance).toFixed(4)} (
                      {userPosition.shareOfPool}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Matrix */}
      <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
        <h3 className="text-xl font-cinzel text-gold mb-4 flex items-center gap-2">
          <TrendingUpIcon className="w-5 h-5" />
          Exchange Rates
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-left text-white/50 font-space-grotesk">
                  From → To
                </th>
                {outcomes.map((outcome) => (
                  <th
                    key={outcome.id}
                    className="pb-3 text-center text-white/50 font-space-grotesk"
                  >
                    #{outcome.id + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outcomes.map((fromOutcome, fromIdx) => (
                <tr
                  key={fromOutcome.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 text-white/70 font-space-grotesk">
                    #{fromOutcome.id + 1}
                  </td>
                  {outcomes.map((toOutcome, toIdx) => {
                    if (fromIdx === toIdx) {
                      return (
                        <td key={toOutcome.id} className="py-3 text-center">
                          <span className="text-white/30">-</span>
                        </td>
                      );
                    }

                    const fromReserve = parseFloat(poolState.reserves[fromIdx] || '0');
                    const toReserve = parseFloat(poolState.reserves[toIdx] || '0');
                    const price =
                      fromReserve > 0 && toReserve > 0
                        ? (toReserve / fromReserve).toFixed(4)
                        : '0.0000';

                    return (
                      <td key={toOutcome.id} className="py-3 text-center">
                        <span className="font-mono text-drift-teal">{price}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-white/50 mt-4">
          Exchange rates show how many LP tokens of the target outcome you receive per
          1 LP token swapped (before fees).
        </p>
      </div>

      {/* Status */}
      <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/50 mb-1">Status:</p>
            <p
              className={`font-space-grotesk ${
                poolState.resolved ? 'text-red-400' : 'text-drift-teal'
              }`}
            >
              {poolState.resolved ? 'Resolved' : 'Active'}
            </p>
          </div>

          {poolState.resolved && poolState.winningOutcome !== undefined && (
            <div>
              <p className="text-white/50 mb-1">Winning Outcome:</p>
              <p className="font-space-grotesk text-gold">
                {outcomes[poolState.winningOutcome]?.text || `#${poolState.winningOutcome}`}
              </p>
            </div>
          )}

          <div>
            <p className="text-white/50 mb-1">Betting Deadline:</p>
            <p className="font-mono text-white">
              {new Date(poolState.bettingDeadline * 1000).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-white/50 mb-1">Chapter ID:</p>
            <p className="font-mono text-white">{poolState.chapterId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
