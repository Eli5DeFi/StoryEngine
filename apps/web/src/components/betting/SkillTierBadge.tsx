/**
 * Skill Tier Badge Component
 * Displays player's skill tier with icon, name, and color
 */

'use client';

import { SkillTier } from '@/lib/dynamic-difficulty/skillRating';
import { motion } from 'framer-motion';

interface SkillTierBadgeProps {
  tier: SkillTier;
  eloRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const TIER_CONFIG = {
  [SkillTier.NOVICE]: {
    name: 'Novice',
    icon: '🌱',
    color: 'text-gray-400 border-gray-500 bg-gray-900/50',
    glow: 'shadow-gray-500/50',
    boost: '+15% odds boost'
  },
  [SkillTier.INTERMEDIATE]: {
    name: 'Intermediate',
    icon: '📈',
    color: 'text-blue-400 border-blue-500 bg-blue-900/30',
    glow: 'shadow-blue-500/50',
    boost: '+5% odds boost'
  },
  [SkillTier.EXPERT]: {
    name: 'Expert',
    icon: '⚡',
    color: 'text-purple-400 border-purple-500 bg-purple-900/30',
    glow: 'shadow-purple-500/50',
    boost: 'Standard odds'
  },
  [SkillTier.MASTER]: {
    name: 'Master',
    icon: '👑',
    color: 'text-yellow-400 border-yellow-500 bg-yellow-900/30',
    glow: 'shadow-yellow-500/50',
    boost: '-5% skill tax'
  },
  [SkillTier.LEGEND]: {
    name: 'Legend',
    icon: '🔥',
    color: 'text-red-400 border-red-500 bg-red-900/30',
    glow: 'shadow-red-500/50',
    boost: '-10% skill tax'
  }
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2'
};

export function SkillTierBadge({ 
  tier, 
  eloRating, 
  size = 'md',
  showTooltip = true 
}: SkillTierBadgeProps) {
  const config = TIER_CONFIG[tier];

  return (
    <motion.div
      className="relative group"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        className={`
          inline-flex items-center gap-2 
          rounded-lg border font-mono
          ${config.color} ${SIZE_CLASSES[size]}
          shadow-lg ${config.glow}
          transition-all duration-300
          hover:scale-105
        `}
      >
        <span className={size === 'lg' ? 'text-xl' : 'text-base'}>
          {config.icon}
        </span>
        <span className="font-semibold uppercase tracking-wider">
          {config.name}
        </span>
        {eloRating !== undefined && (
          <span className="text-xs opacity-70">
            {eloRating}
          </span>
        )}
      </div>

      {showTooltip && (
        <div 
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            hidden group-hover:block
            bg-black/95 text-white text-xs
            px-3 py-2 rounded-lg
            whitespace-nowrap
            border border-gray-700
            z-50
          "
        >
          <div className="font-semibold mb-1">{config.name} Tier</div>
          <div className="opacity-80">{config.boost}</div>
          {eloRating !== undefined && (
            <div className="mt-1 text-gray-400">
              ELO: {eloRating}
            </div>
          )}
          <div 
            className="
              absolute top-full left-1/2 -translate-x-1/2
              w-0 h-0
              border-l-4 border-r-4 border-t-4
              border-l-transparent border-r-transparent border-t-gray-700
            "
          />
        </div>
      )}
    </motion.div>
  );
}
