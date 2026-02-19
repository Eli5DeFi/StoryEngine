'use client'

/**
 * RivalryMatrix — Visualizes inter-house rivalry tensions.
 *
 * Renders a 5x5 heatmap grid showing rivalry intensity between Houses.
 * High intensity = deep red. Low intensity = subtle grey.
 *
 * Used on the House Agents page as a global conflict overview.
 */

import { motion } from 'framer-motion'
import type { HouseAgentPublicProfile } from '@/app/api/house-agents/route'

interface RivalryMatrixProps {
  agents: HouseAgentPublicProfile[]
}

export function RivalryMatrix({ agents }: RivalryMatrixProps) {
  if (agents.length === 0) return null

  const houses = agents.map((a) => ({ id: a.houseId, emoji: a.emoji, name: a.name, accentHex: a.accentHex }))

  function getIntensity(fromId: string, toId: string): number {
    if (fromId === toId) return -1  // diagonal — skip
    const agent = agents.find((a) => a.houseId === fromId)
    return agent?.rivalIntensity[toId] ?? 0
  }

  function intensityColor(intensity: number): string {
    if (intensity < 0) return 'transparent'
    if (intensity >= 80) return 'rgba(239, 68, 68, 0.7)'   // hot red
    if (intensity >= 60) return 'rgba(234, 88, 12, 0.5)'   // orange
    if (intensity >= 40) return 'rgba(234, 179, 8, 0.35)'  // amber
    if (intensity >= 20) return 'rgba(100, 116, 139, 0.25)' // grey-blue
    return 'rgba(255,255,255,0.04)'                          // near zero
  }

  function intensityLabel(intensity: number): string {
    if (intensity < 0) return ''
    if (intensity >= 80) return 'Mortal'
    if (intensity >= 60) return 'High'
    if (intensity >= 40) return 'Tense'
    if (intensity >= 20) return 'Cool'
    return 'Neutral'
  }

  return (
    <div className="glass-card rounded-2xl border border-void-800 p-6">
      <h3 className="text-lg font-cinzel font-bold text-gold mb-1">
        Rivalry Matrix
      </h3>
      <p className="text-sm text-void-400 mb-5">
        Inter-house tension — shaped by agent bet history and ideological clashes.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="w-14 pb-3" />
              {houses.map((h) => (
                <th key={h.id} className="pb-3 text-center font-ui font-normal text-void-400 uppercase tracking-wider px-1">
                  <span className="text-base">{h.emoji}</span>
                  <div>{h.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {houses.map((fromHouse, rowIdx) => (
              <tr key={fromHouse.id}>
                <td className="py-1 pr-3 font-ui text-void-400 uppercase tracking-wider whitespace-nowrap">
                  <span className="mr-1.5">{fromHouse.emoji}</span>
                  {fromHouse.name}
                </td>
                {houses.map((toHouse, colIdx) => {
                  const intensity = getIntensity(fromHouse.id, toHouse.id)
                  const isDiag = fromHouse.id === toHouse.id

                  return (
                    <td key={toHouse.id} className="px-1 py-1">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (rowIdx * 5 + colIdx) * 0.02 }}
                        className="w-16 h-12 rounded-lg flex flex-col items-center justify-center cursor-default relative group"
                        style={{ backgroundColor: intensityColor(intensity) }}
                      >
                        {isDiag ? (
                          <span className="text-void-800 text-lg">—</span>
                        ) : (
                          <>
                            <span className="font-bold text-foreground">{intensity}</span>
                            <span className="text-void-400" style={{ fontSize: '10px' }}>
                              {intensityLabel(intensity)}
                            </span>
                          </>
                        )}
                      </motion.div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 flex-wrap">
        <span className="text-xs text-void-500 font-ui uppercase tracking-wider">Intensity:</span>
        {[
          { label: 'Mortal (80+)', color: 'rgba(239, 68, 68, 0.7)' },
          { label: 'High (60+)',   color: 'rgba(234, 88, 12, 0.5)' },
          { label: 'Tense (40+)', color: 'rgba(234, 179, 8, 0.35)' },
          { label: 'Cool (20+)',  color: 'rgba(100, 116, 139, 0.25)' },
          { label: 'Neutral',     color: 'rgba(255,255,255,0.04)' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-void-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
