'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Trophy, Flame, TrendingUp, Award } from 'lucide-react'

interface Badge {
  id: string
  name: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  earnedAt: string
}

interface CharacterNFT {
  tokenId: number
  archetype: 'NONE' | 'STRATEGIST' | 'GAMBLER' | 'ORACLE' | 'CONTRARIAN'
  riskLevel: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'
  alignment: 'NEUTRAL' | 'ORDER' | 'CHAOS'
  totalBets: number
  winRate: number // 0-100
  currentStreak: number
  longestStreak: number
  totalWon: number
  imageURI?: string
  badges: Badge[]
}

interface CharacterNFTCardProps {
  nft: CharacterNFT
  compact?: boolean
}

const ARCHETYPE_COLORS = {
  NONE: 'from-gray-500 to-gray-600',
  STRATEGIST: 'from-blue-500 to-blue-600',
  GAMBLER: 'from-red-500 to-red-600',
  ORACLE: 'from-purple-500 to-purple-600',
  CONTRARIAN: 'from-green-500 to-green-600',
}

const ARCHETYPE_DESCRIPTIONS = {
  NONE: 'Just getting started...',
  STRATEGIST: 'High win rate, calculated bets',
  GAMBLER: 'Large bets, high variance',
  ORACLE: 'Master of prediction',
  CONTRARIAN: 'Bets against the crowd',
}

const RARITY_COLORS = {
  COMMON: 'text-gray-400 border-gray-400',
  RARE: 'text-blue-400 border-blue-400',
  EPIC: 'text-purple-400 border-purple-400',
  LEGENDARY: 'text-yellow-400 border-yellow-400',
}

export function CharacterNFTCard({ nft, compact = false }: CharacterNFTCardProps) {
  if (compact) {
    return <CompactCard nft={nft} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">
            Character #{nft.tokenId}
          </h3>
          <p className={`text-lg bg-gradient-to-r ${ARCHETYPE_COLORS[nft.archetype]} bg-clip-text text-transparent font-semibold`}>
            {nft.archetype === 'NONE' ? 'Unnamed' : nft.archetype}
          </p>
          <p className="text-sm text-gray-400">
            {ARCHETYPE_DESCRIPTIONS[nft.archetype]}
          </p>
        </div>
        
        {/* NFT Image */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700">
          {nft.imageURI ? (
            <Image
              src={nft.imageURI}
              alt={`Character ${nft.tokenId}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${ARCHETYPE_COLORS[nft.archetype]} flex items-center justify-center text-4xl font-bold text-white`}>
              {nft.tokenId}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Win Rate"
          value={`${nft.winRate.toFixed(1)}%`}
          color="text-green-400"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Total Bets"
          value={nft.totalBets.toString()}
          color="text-blue-400"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={nft.currentStreak.toString()}
          color="text-orange-400"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Best Streak"
          value={nft.longestStreak.toString()}
          color="text-purple-400"
        />
      </div>

      {/* Traits */}
      <div className="flex gap-2 flex-wrap">
        <TraitBadge label="Risk" value={nft.riskLevel} />
        <TraitBadge label="Alignment" value={nft.alignment} />
      </div>

      {/* Badges */}
      {nft.badges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Badges ({nft.badges.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {nft.badges.slice(0, 4).map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
          {nft.badges.length > 4 && (
            <p className="text-xs text-gray-500 text-center">
              +{nft.badges.length - 4} more
            </p>
          )}
        </div>
      )}

      {/* Total Winnings */}
      <div className="pt-4 border-t border-gray-800">
        <p className="text-sm text-gray-400">Total Winnings</p>
        <p className="text-2xl font-bold text-green-400">
          ${nft.totalWon.toFixed(2)}
        </p>
      </div>
    </motion.div>
  )
}

function CompactCard({ nft }: { nft: CharacterNFT }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
        {nft.imageURI ? (
          <Image
            src={nft.imageURI}
            alt={`Character ${nft.tokenId}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${ARCHETYPE_COLORS[nft.archetype]} flex items-center justify-center text-sm font-bold text-white`}>
            #{nft.tokenId}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold bg-gradient-to-r ${ARCHETYPE_COLORS[nft.archetype]} bg-clip-text text-transparent truncate`}>
          {nft.archetype === 'NONE' ? 'Character' : nft.archetype}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {nft.winRate.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {nft.currentStreak}
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            {nft.badges.length}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function TraitBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs">
      <span className="text-gray-400">{label}:</span>{' '}
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-2 bg-gray-800 border ${RARITY_COLORS[badge.rarity]} rounded-lg`}
    >
      <p className={`text-xs font-semibold truncate ${RARITY_COLORS[badge.rarity]}`}>
        {badge.name}
      </p>
      <p className="text-xs text-gray-500">
        {new Date(badge.earnedAt).toLocaleDateString()}
      </p>
    </motion.div>
  )
}
