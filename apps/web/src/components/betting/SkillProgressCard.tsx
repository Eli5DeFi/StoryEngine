/**
 * Skill Progress Card Component
 * Shows player's progress toward next tier with ELO and bet requirements
 */

'use client';

import { SkillTier } from '@/lib/dynamic-difficulty/skillRating';
import { motion } from 'framer-motion';
import { SkillTierBadge } from './SkillTierBadge';

interface SkillProgressCardProps {
  currentTier: SkillTier;
  nextTier: SkillTier | null;
  eloRating: number;
  totalBets: number;
  wins: number;
  winRate: number;
  currentStreak: number;
  betsNeeded: number;
  eloNeeded: number;
  progressPercent: number;
}

export function SkillProgressCard({
  currentTier,
  nextTier,
  eloRating,
  totalBets,
  wins,
  winRate,
  currentStreak,
  betsNeeded,
  eloNeeded,
  progressPercent
}: SkillProgressCardProps) {
  const isMaxTier = !nextTier;

  return (
    <motion.div
      className="
        bg-gradient-to-br from-gray-900 via-black to-gray-900
        border border-gray-800 rounded-xl p-6
        shadow-2xl
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-1">
            Your Skill Tier
          </h3>
          <p className="text-sm text-gray-500">
            Based on your betting performance
          </p>
        </div>
        <SkillTierBadge tier={currentTier} eloRating={eloRating} size="lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox
          label="Total Bets"
          value={totalBets}
          icon="🎲"
        />
        <StatBox
          label="Wins"
          value={wins}
          icon="🏆"
        />
        <StatBox
          label="Win Rate"
          value={`${(winRate * 100).toFixed(1)}%`}
          icon="📊"
        />
        <StatBox
          label="Current Streak"
          value={currentStreak}
          icon={currentStreak >= 0 ? "🔥" : "❄️"}
          positive={currentStreak >= 0}
        />
      </div>

      {/* Progress to Next Tier */}
      {!isMaxTier ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress to {nextTier}</span>
            <span className="text-gray-300 font-mono font-semibold">
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {betsNeeded > 0 && (
              <RequirementBox
                label="Bets Needed"
                value={betsNeeded}
                icon="🎯"
              />
            )}
            {eloNeeded > 0 && (
              <RequirementBox
                label="ELO Needed"
                value={`+${eloNeeded}`}
                icon="📈"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-lg font-semibold text-yellow-400 mb-1">
            Maximum Tier Achieved!
          </div>
          <div className="text-sm text-gray-400">
            You're in the top 1% of bettors
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatBox({ 
  label, 
  value, 
  icon,
  positive 
}: { 
  label: string; 
  value: string | number; 
  icon: string;
  positive?: boolean;
}) {
  const valueColor = positive === undefined 
    ? 'text-gray-200' 
    : positive 
    ? 'text-green-400' 
    : 'text-red-400';

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-xl font-bold font-mono ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function RequirementBox({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  icon: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-gray-800/30 rounded px-3 py-2 border border-gray-700/30">
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-300">{value}</div>
      </div>
    </div>
  );
}
