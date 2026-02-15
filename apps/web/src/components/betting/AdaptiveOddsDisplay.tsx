/**
 * Adaptive Odds Display Component
 * Shows personalized odds based on player's skill tier
 */

'use client';

import { SkillTier } from '@/lib/dynamic-difficulty/skillRating';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AdaptiveOddsDisplayProps {
  standardOdds: number;
  tier: SkillTier;
  betAmount?: number;
}

const TIER_MULTIPLIERS = {
  [SkillTier.NOVICE]: 1.15,
  [SkillTier.INTERMEDIATE]: 1.05,
  [SkillTier.EXPERT]: 1.0,
  [SkillTier.MASTER]: 0.95,
  [SkillTier.LEGEND]: 0.90
};

export function AdaptiveOddsDisplay({
  standardOdds,
  tier,
  betAmount
}: AdaptiveOddsDisplayProps) {
  const [showComparison, setShowComparison] = useState(false);

  const multiplier = TIER_MULTIPLIERS[tier];
  const adaptiveOdds = standardOdds * multiplier;
  const isBoost = multiplier > 1;
  const isPenalty = multiplier < 1;

  const standardPayout = betAmount ? betAmount * standardOdds : 0;
  const adaptivePayout = betAmount ? betAmount * adaptiveOdds : 0;
  const payoutDiff = adaptivePayout - standardPayout;

  return (
    <div className="space-y-3">
      {/* Main Odds Display */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Your Personalized Odds</div>
        <motion.div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg
            ${isBoost ? 'bg-green-900/30 border border-green-700/50' : ''}
            ${isPenalty ? 'bg-red-900/30 border border-red-700/50' : ''}
            ${!isBoost && !isPenalty ? 'bg-gray-800/50 border border-gray-700/50' : ''}
          `}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-lg font-bold font-mono text-gray-200">
            {adaptiveOdds.toFixed(2)}x
          </span>
          {multiplier !== 1.0 && (
            <span 
              className={`
                text-xs font-semibold
                ${isBoost ? 'text-green-400' : 'text-red-400'}
              `}
            >
              {isBoost ? '+' : ''}{((multiplier - 1) * 100).toFixed(0)}%
            </span>
          )}
        </motion.div>
      </div>

      {/* Comparison Toggle */}
      {multiplier !== 1.0 && (
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="
            w-full text-xs text-gray-500 hover:text-gray-400
            transition-colors duration-200
            flex items-center justify-center gap-1
          "
        >
          {showComparison ? '🔼' : '🔽'}
          <span>
            {showComparison ? 'Hide' : 'Show'} comparison to standard odds
          </span>
        </button>
      )}

      {/* Comparison Details */}
      {showComparison && multiplier !== 1.0 && (
        <motion.div
          className="
            bg-gray-900/50 rounded-lg p-3 space-y-2
            border border-gray-800
          "
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Standard Odds:</span>
            <span className="text-gray-400 font-mono">
              {standardOdds.toFixed(2)}x
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Your Tier Adjustment:</span>
            <span 
              className={`font-semibold ${isBoost ? 'text-green-400' : 'text-red-400'}`}
            >
              {isBoost ? '+' : ''}{((multiplier - 1) * 100).toFixed(0)}%
            </span>
          </div>
          
          {betAmount && betAmount > 0 && (
            <>
              <div className="h-px bg-gray-800 my-2" />
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Standard Payout:</span>
                <span className="text-gray-400 font-mono">
                  ${standardPayout.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Your Payout:</span>
                <span className="text-gray-300 font-mono font-semibold">
                  ${adaptivePayout.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-400">Difference:</span>
                <span 
                  className={`
                    font-mono
                    ${payoutDiff > 0 ? 'text-green-400' : 'text-red-400'}
                  `}
                >
                  {payoutDiff > 0 ? '+' : ''}${payoutDiff.toFixed(2)}
                </span>
              </div>
            </>
          )}

          {/* Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="text-xs text-gray-500 leading-relaxed">
              {isBoost && (
                <>
                  <span className="text-green-400 font-semibold">Beginner Boost:</span>
                  {' '}You receive better odds as a {tier} to help you compete with experienced bettors.
                </>
              )}
              {isPenalty && (
                <>
                  <span className="text-red-400 font-semibold">Skill Tax:</span>
                  {' '}Your odds are reduced as a {tier} tier bettor to maintain fair competition.
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Box for New Players */}
      {tier === SkillTier.NOVICE && (
        <div className="
          bg-blue-900/20 border border-blue-700/30 rounded-lg p-3
          text-xs text-blue-300
        ">
          <div className="flex items-start gap-2">
            <span className="text-base">💡</span>
            <div>
              <div className="font-semibold mb-1">New Player Advantage</div>
              <div className="opacity-90 leading-relaxed">
                As a Novice, you get a <strong>+15% odds boost</strong> to help you compete.
                Place more bets to increase your ELO and unlock higher tiers!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
