/**
 * Swap Interface Component
 * 
 * Allows users to swap betting positions between outcomes.
 * Features real-time quotes, slippage protection, and price impact warnings.
 * 
 * @author Voidborne Team (Innovation Cycle #46)
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useSwap, useSwapQuote, useLPPositions, useBettingStatus } from '@/hooks/useNLP';
import { ArrowDownIcon, RefreshCwIcon, AlertTriangleIcon } from 'lucide-react';

interface SwapInterfaceProps {
  chapterId: number;
  outcomes: Array<{ id: number; text: string }>;
}

export function SwapInterface({ chapterId, outcomes }: SwapInterfaceProps) {
  const [fromOutcome, setFromOutcome] = useState(0);
  const [toOutcome, setToOutcome] = useState(1);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5); // 0.5%

  const { swap, loading: swapping, error: swapError } = useSwap();
  const { quote, loading: quoteLoading, refetch: refetchQuote } = useSwapQuote(
    chapterId,
    fromOutcome,
    toOutcome,
    amountIn
  );
  const { positions, refetch: refetchPositions } = useLPPositions(chapterId, outcomes.length);
  const { isOpen, formatted: timeRemaining } = useBettingStatus(chapterId);

  // Auto-refetch quote every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (amountIn && parseFloat(amountIn) > 0) {
        refetchQuote();
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [amountIn, refetchQuote]);

  // Get user's balance for selected outcome
  const fromPosition = positions.find((p) => p.outcomeId === fromOutcome);
  const maxAmount = fromPosition?.lpBalance || '0';

  const handleSwap = async () => {
    try {
      await swap(chapterId, fromOutcome, toOutcome, amountIn, slippage);
      setAmountIn('');
      refetchPositions();
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  const handleFlip = () => {
    const temp = fromOutcome;
    setFromOutcome(toOutcome);
    setToOutcome(temp);
  };

  const priceImpactNum = quote ? parseFloat(quote.priceImpact) : 0;
  const isPriceImpactHigh = priceImpactNum > 2; // > 2%
  const isPriceImpactVeryHigh = priceImpactNum > 5; // > 5%

  if (!isOpen) {
    return (
      <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-8 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-gold mx-auto mb-4" />
        <h3 className="text-xl font-cinzel text-white mb-2">Betting Closed</h3>
        <p className="text-white/70">
          Swaps are only available while betting is open.
          <br />
          Status: {timeRemaining}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-void-purple/30 backdrop-blur-sm border border-gold/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-cinzel text-gold">Swap Positions</h2>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <span>Time Remaining:</span>
          <span className="text-drift-teal font-mono">{timeRemaining}</span>
        </div>
      </div>

      {/* From */}
      <div className="bg-void-purple/50 border border-white/10 rounded-xl p-4 mb-2">
        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
          From
        </label>
        <div className="flex items-center gap-4">
          <select
            value={fromOutcome}
            onChange={(e) => setFromOutcome(parseInt(e.target.value))}
            className="flex-1 bg-void-purple/70 border border-white/20 rounded-lg px-4 py-2 text-white font-space-grotesk focus:outline-none focus:border-gold/50 transition-colors"
          >
            {outcomes.map((outcome) => (
              <option key={outcome.id} value={outcome.id}>
                {outcome.text}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="w-32 bg-transparent border-none text-right text-2xl text-white font-space-grotesk focus:outline-none"
            min="0"
            step="0.01"
          />
        </div>

        {fromPosition && (
          <div className="flex items-center justify-between mt-2 text-xs text-white/50">
            <span>Balance: {parseFloat(fromPosition.lpBalance).toFixed(4)} LP</span>
            <button
              onClick={() => setAmountIn(maxAmount)}
              className="text-drift-teal hover:text-drift-teal/80 transition-colors"
            >
              MAX
            </button>
          </div>
        )}
      </div>

      {/* Flip Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleFlip}
          className="bg-void-purple border-2 border-gold/30 rounded-full p-2 hover:border-gold transition-all hover:scale-110"
          aria-label="Flip outcomes"
        >
          <ArrowDownIcon className="w-5 h-5 text-gold" />
        </button>
      </div>

      {/* To */}
      <div className="bg-void-purple/50 border border-white/10 rounded-xl p-4 mb-4">
        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
          To
        </label>
        <div className="flex items-center gap-4">
          <select
            value={toOutcome}
            onChange={(e) => setToOutcome(parseInt(e.target.value))}
            className="flex-1 bg-void-purple/70 border border-white/20 rounded-lg px-4 py-2 text-white font-space-grotesk focus:outline-none focus:border-gold/50 transition-colors"
          >
            {outcomes.map((outcome) => (
              <option key={outcome.id} value={outcome.id}>
                {outcome.text}
              </option>
            ))}
          </select>

          <div className="w-32 text-right text-2xl text-white font-space-grotesk">
            {quoteLoading ? (
              <RefreshCwIcon className="w-6 h-6 animate-spin ml-auto" />
            ) : quote ? (
              parseFloat(quote.amountOut).toFixed(4)
            ) : (
              '0.0'
            )}
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="bg-void-purple/30 border border-white/10 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-white/70">
            <span>Exchange Rate:</span>
            <span className="font-mono">
              1 : {parseFloat(quote.price).toFixed(4)}
            </span>
          </div>

          <div className="flex justify-between text-white/70">
            <span>Swap Fee (0.3%):</span>
            <span className="font-mono">{parseFloat(quote.fee).toFixed(4)} LP</span>
          </div>

          <div className="flex justify-between text-white/70">
            <span>Price Impact:</span>
            <span
              className={`font-mono ${
                isPriceImpactVeryHigh
                  ? 'text-red-400'
                  : isPriceImpactHigh
                  ? 'text-yellow-400'
                  : 'text-drift-teal'
              }`}
            >
              {quote.priceImpact}%
            </span>
          </div>

          <div className="flex justify-between text-white/70">
            <span>Slippage Tolerance:</span>
            <span className="font-mono">{slippage}%</span>
          </div>

          <div className="flex justify-between text-white/70">
            <span>Minimum Received:</span>
            <span className="font-mono">
              {(parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(4)} LP
            </span>
          </div>
        </div>
      )}

      {/* Price Impact Warning */}
      {isPriceImpactVeryHigh && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-red-400 font-semibold mb-1">Very High Price Impact!</p>
            <p className="text-white/70">
              This swap will significantly move the market price. Consider breaking it into smaller swaps.
            </p>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={
          swapping ||
          !amountIn ||
          parseFloat(amountIn) <= 0 ||
          parseFloat(amountIn) > parseFloat(maxAmount) ||
          fromOutcome === toOutcome
        }
        className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 disabled:from-gray-600 disabled:to-gray-700 text-void-purple font-cinzel font-bold py-4 rounded-xl transition-all disabled:cursor-not-allowed"
      >
        {swapping
          ? 'Swapping...'
          : !amountIn || parseFloat(amountIn) <= 0
          ? 'Enter Amount'
          : parseFloat(amountIn) > parseFloat(maxAmount)
          ? 'Insufficient Balance'
          : fromOutcome === toOutcome
          ? 'Select Different Outcome'
          : 'Swap Position'}
      </button>

      {/* Error Display */}
      {swapError && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {swapError.message}
        </div>
      )}

      {/* Settings */}
      <details className="mt-4">
        <summary className="text-sm text-white/50 cursor-pointer hover:text-white/70 transition-colors">
          Advanced Settings
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">
              Slippage Tolerance
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1.0, 2.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`py-2 rounded-lg border transition-all ${
                    slippage === val
                      ? 'bg-gold/20 border-gold text-gold'
                      : 'bg-void-purple/50 border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
