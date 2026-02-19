'use client'

/**
 * VoidMap — SVG territory control visualization
 *
 * Renders the 6-sector Void Map showing which guild controls each sector.
 * Each sector is a hexagonal cell with the controlling guild's house color.
 * Uncontrolled sectors pulse with a dimmer animation.
 *
 * Used on: /guilds (overview) and /guilds/[guildId] (detail)
 */

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export interface VoidSector {
  id: string
  name: string
  description: string
  controllerGuildId: string | null
  controllerGuildName: string | null
  controllerHouseColor: string | null
  controllerEmoji: string | null
  yieldPerChapterUsdc: number
  defenseStrength: number // 0-100
  position: { col: number; row: number } // grid position
}

// The 6 sectors of the Void Map
const DEFAULT_SECTORS: VoidSector[] = [
  {
    id: 'sector_core',
    name: 'Void Core',
    description: 'The heart of the Void. Highest yield, highest contested.',
    controllerGuildId: 'guild_valdris_throne',
    controllerGuildName: 'The Eternal Guard',
    controllerHouseColor: '#8b7ab8',
    controllerEmoji: '👑',
    yieldPerChapterUsdc: 120,
    defenseStrength: 87,
    position: { col: 1, row: 0 },
  },
  {
    id: 'sector_thread_nexus',
    name: 'Thread Nexus',
    description: 'Where all narrative threads converge. Lore canon advantage.',
    controllerGuildId: 'guild_valdris_throne',
    controllerGuildName: 'The Eternal Guard',
    controllerHouseColor: '#8b7ab8',
    controllerEmoji: '👑',
    yieldPerChapterUsdc: 80,
    defenseStrength: 72,
    position: { col: 2, row: 1 },
  },
  {
    id: 'sector_null_wastes',
    name: 'Null Wastes',
    description: 'Unstable. High variance. Danger yields high reward.',
    controllerGuildId: null,
    controllerGuildName: null,
    controllerHouseColor: null,
    controllerEmoji: null,
    yieldPerChapterUsdc: 100,
    defenseStrength: 0,
    position: { col: 0, row: 1 },
  },
  {
    id: 'sector_golden_spire',
    name: 'Golden Spire',
    description: 'Commercial hub. Steady yields, low volatility.',
    controllerGuildId: 'guild_aurelius_coin',
    controllerGuildName: 'The Golden Ledger',
    controllerHouseColor: '#d4a853',
    controllerEmoji: '⚖️',
    yieldPerChapterUsdc: 70,
    defenseStrength: 65,
    position: { col: 0, row: 2 },
  },
  {
    id: 'sector_shadow_gate',
    name: 'Shadow Gate',
    description: 'Obsidian territory. Contested but defended by dark arts.',
    controllerGuildId: 'guild_obsidian_veil',
    controllerGuildName: 'The Shroud Collective',
    controllerHouseColor: '#334155',
    controllerEmoji: '🌑',
    yieldPerChapterUsdc: 60,
    defenseStrength: 55,
    position: { col: 2, row: 2 },
  },
  {
    id: 'sector_drift_basin',
    name: 'Drift Basin',
    description: 'Open territory. Weak defenses — first to the Void claims it.',
    controllerGuildId: null,
    controllerGuildName: null,
    controllerHouseColor: null,
    controllerEmoji: null,
    yieldPerChapterUsdc: 50,
    defenseStrength: 0,
    position: { col: 1, row: 2 },
  },
]

interface VoidMapProps {
  sectors?: VoidSector[]
  highlightGuildId?: string // highlight sectors held by this guild
  compact?: boolean // smaller rendering for sidebars
}

export function VoidMap({
  sectors = DEFAULT_SECTORS,
  highlightGuildId,
  compact = false,
}: VoidMapProps) {
  const size = compact ? 280 : 420
  const hexSize = compact ? 68 : 96
  const padding = compact ? 24 : 36

  // Hexagonal grid math (pointy-top)
  function hexToPixel(col: number, row: number) {
    const x = padding + col * hexSize * 1.15 + (row % 2) * (hexSize * 0.575)
    const y = padding + row * hexSize * 0.95
    return { x, y }
  }

  // Flat-top hexagon path
  function hexPath(cx: number, cy: number, r: number): string {
    const corners = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    })
    return `M ${corners.join(' L ')} Z`
  }

  const svgWidth = size + padding
  const svgHeight = size

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`font-cinzel font-bold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}
        >
          🗺 Void Territory Map
        </h3>
        <div className="flex items-center gap-3">
          <LegendDot color="#3f3f46" label="Unclaimed" />
          <LegendDot color="#22c55e" label="Contested" />
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative rounded-xl overflow-hidden border border-void-800/40 bg-void-950/80">
        {/* Starfield background */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <svg
          width="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="relative z-10"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="voidCenter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b2e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#05060b" stopOpacity="0.3" />
            </radialGradient>
          </defs>

          {sectors.map((sector) => {
            const { x, y } = hexToPixel(sector.position.col, sector.position.row)
            const r = hexSize * 0.48
            const path = hexPath(x + r, y + r, r)

            const isControlled = sector.controllerGuildId !== null
            const isHighlighted =
              highlightGuildId && sector.controllerGuildId === highlightGuildId
            const fillColor = isControlled
              ? sector.controllerHouseColor! + '33'
              : '#1e293b'
            const strokeColor = isControlled
              ? sector.controllerHouseColor! + 'aa'
              : '#334155'

            return (
              <g key={sector.id}>
                {/* Glow ring for highlighted sectors */}
                {isHighlighted && (
                  <path
                    d={path}
                    fill="none"
                    stroke={sector.controllerHouseColor! + '66'}
                    strokeWidth={3}
                    filter="url(#glow)"
                  />
                )}

                {/* Main hex */}
                <path
                  d={path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 2 : 1}
                />

                {/* Sector name */}
                <text
                  x={x + r}
                  y={y + r - (compact ? 10 : 14)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isControlled ? '#e8e6e3' : '#6e6e77'}
                  fontSize={compact ? 7 : 9}
                  fontFamily="Cinzel, serif"
                  fontWeight="600"
                >
                  {sector.name}
                </text>

                {/* Controller emoji */}
                {isControlled && (
                  <text
                    x={x + r}
                    y={y + r + (compact ? 4 : 6)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={compact ? 14 : 20}
                  >
                    {sector.controllerEmoji}
                  </text>
                )}

                {/* Yield badge */}
                <text
                  x={x + r}
                  y={y + r + (compact ? 18 : 26)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isControlled ? '#d4a853' : '#4c4c53'}
                  fontSize={compact ? 6 : 8}
                  fontFamily="JetBrains Mono, monospace"
                >
                  +${sector.yieldPerChapterUsdc}/ch
                </text>

                {/* Unclaimed pulsing dot */}
                {!isControlled && (
                  <circle
                    cx={x + r}
                    cy={y + r}
                    r={compact ? 4 : 6}
                    fill="#334155"
                    stroke="#475569"
                    strokeWidth={1}
                    opacity={0.6}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Sector list below map */}
      <div className={`mt-3 space-y-1.5 ${compact ? 'hidden' : ''}`}>
        {sectors.map((sector) => (
          <div
            key={sector.id}
            className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-void-900/40 border border-void-800/30"
          >
            <div className="flex items-center gap-2">
              <span>{sector.controllerEmoji ?? '⬜'}</span>
              <span className="font-cinzel font-semibold text-foreground/80">
                {sector.name}
              </span>
              {sector.controllerGuildName && (
                <span className="text-void-500">
                  — {sector.controllerGuildName}
                </span>
              )}
              {!sector.controllerGuildName && (
                <span className="text-void-600 italic">Unclaimed</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sector.defenseStrength > 0 && (
                <span className="text-void-400">
                  🛡 {sector.defenseStrength}%
                </span>
              )}
              <span className="text-gold font-mono">
                +${sector.yieldPerChapterUsdc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full border border-void-600"
        style={{ backgroundColor: color }}
      />
      <span className="text-void-400 text-xs font-ui">{label}</span>
    </div>
  )
}
