'use client'

/**
 * Consequence Tree Visualization
 * 
 * Displays how choices ripple through future chapters,
 * showing character relationships, world state, and plot threads.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  User,
  Globe,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import type { NarrativeState, ConsequenceTriggerResult } from '@voidborne/consequence-engine'

interface ConsequenceTreeProps {
  result: ConsequenceTriggerResult
  className?: string
}

export function ConsequenceTree({ result, className = '' }: ConsequenceTreeProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['characters', 'world'])
  )

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections)
    if (newSet.has(section)) {
      newSet.delete(section)
    } else {
      newSet.add(section)
    }
    setExpandedSections(newSet)
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 border-red-500/30'
      case 'major':
        return 'text-amber-400 border-amber-500/30'
      case 'moderate':
        return 'text-yellow-400 border-yellow-500/30'
      case 'minor':
        return 'text-gray-400 border-gray-500/30'
      default:
        return 'text-gray-400 border-gray-500/30'
    }
  }

  const getChangeIcon = (path: string, oldValue: any, newValue: any) => {
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      return newValue > oldValue ? (
        <TrendingUp className="w-4 h-4 text-green-400" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-400" />
      )
    }
    return <CheckCircle className="w-4 h-4 text-gold" />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border border-gold/20 bg-void/50 p-6 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gold flex items-center gap-2">
            <Network className="w-5 h-5" />
            Consequence Propagation
          </h3>
          {result.success ? (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Applied {result.appliedRules.length} rules
            </span>
          ) : (
            <span className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Failed
            </span>
          )}
        </div>

        {/* Applied Rules */}
        {result.appliedRules.length > 0 && (
          <div className="space-y-2">
            {result.appliedRules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(
                  rule.severity
                )} bg-void/30`}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{rule.displayText || rule.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{rule.description}</div>
                  {rule.futureRequirements && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(rule.futureRequirements).map(([chapter, reqs]) => (
                        <div key={chapter} className="flex items-start gap-2 text-xs text-gray-300">
                          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            <span className="text-gold font-medium">Ch {chapter}:</span>{' '}
                            {Array.isArray(reqs) ? reqs.join(', ') : reqs}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* State Changes */}
      {result.changes.length > 0 && (
        <div className="border border-gold/20 bg-void/50 p-6 rounded-lg backdrop-blur-sm">
          <h4 className="text-lg font-bold text-gold mb-4">State Changes</h4>
          <div className="space-y-3">
            {result.changes.map((change, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-void/30 border border-gray-700/50"
              >
                {getChangeIcon(change.path, change.oldValue, change.newValue)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">{change.path}</div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-gray-400">{JSON.stringify(change.oldValue)}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-gold">{JSON.stringify(change.newValue)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Character States */}
      {Object.keys(result.newState.characters).length > 0 && (
        <div className="border border-gold/20 bg-void/50 rounded-lg backdrop-blur-sm overflow-hidden">
          <button
            onClick={() => toggleSection('characters')}
            className="w-full flex items-center justify-between p-4 hover:bg-void/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              <h4 className="text-lg font-bold text-gold">Characters</h4>
              <span className="text-sm text-gray-400">
                ({Object.keys(result.newState.characters).length})
              </span>
            </div>
            {expandedSections.has('characters') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('characters') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-3"
              >
                {Object.entries(result.newState.characters).map(([charId, char]) => (
                  <div
                    key={charId}
                    className="p-4 rounded-lg bg-void/30 border border-gray-700/50 space-y-2"
                  >
                    <div className="font-medium text-gray-200">{charId}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Reputation:</span>{' '}
                        <span
                          className={
                            char.reputation > 40
                              ? 'text-green-400'
                              : char.reputation < -40
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        >
                          {char.reputation}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Power:</span>{' '}
                        <span className="text-gold">{char.powerLevel}/100</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Location:</span>{' '}
                        <span className="text-gray-300">{char.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Alive:</span>{' '}
                        <span className={char.alive ? 'text-green-400' : 'text-red-400'}>
                          {char.alive ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    {Object.keys(char.relationships).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700/50">
                        <div className="text-xs text-gray-400 mb-1">Relationships:</div>
                        <div className="space-y-1">
                          {Object.entries(char.relationships).map(([other, score]) => (
                            <div key={other} className="flex items-center justify-between text-xs">
                              <span className="text-gray-300">{other}</span>
                              <span
                                className={
                                  score > 40
                                    ? 'text-green-400'
                                    : score < -40
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                                }
                              >
                                {score}/100
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* World State */}
      <div className="border border-gold/20 bg-void/50 rounded-lg backdrop-blur-sm overflow-hidden">
        <button
          onClick={() => toggleSection('world')}
          className="w-full flex items-center justify-between p-4 hover:bg-void/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold" />
            <h4 className="text-lg font-bold text-gold">World State</h4>
          </div>
          {expandedSections.has('world') ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has('world') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-void/30">
                  <div className="text-gray-400 text-xs mb-1">Political Tension</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          result.newState.world.politicalTension > 70
                            ? 'bg-red-500'
                            : result.newState.world.politicalTension > 40
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${result.newState.world.politicalTension}%` }}
                      />
                    </div>
                    <span className="text-gray-200 font-medium">
                      {result.newState.world.politicalTension}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-void/30">
                  <div className="text-gray-400 text-xs mb-1">Economic Stability</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          result.newState.world.economicStability > 70
                            ? 'bg-green-500'
                            : result.newState.world.economicStability > 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${result.newState.world.economicStability}%` }}
                      />
                    </div>
                    <span className="text-gray-200 font-medium">
                      {result.newState.world.economicStability}
                    </span>
                  </div>
                </div>
              </div>

              {Object.keys(result.newState.world.factionInfluence).length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-void/30">
                  <div className="text-gray-400 text-xs mb-2">Faction Influence</div>
                  <div className="space-y-2">
                    {Object.entries(result.newState.world.factionInfluence).map(
                      ([faction, influence]) => (
                        <div key={faction} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-300 flex-1">{faction}</span>
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold transition-all"
                              style={{ width: `${influence}%` }}
                            />
                          </div>
                          <span className="text-gray-200 w-8 text-right">{influence}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plot Threads */}
      {Object.keys(result.newState.plotThreads).length > 0 && (
        <div className="border border-gold/20 bg-void/50 rounded-lg backdrop-blur-sm overflow-hidden">
          <button
            onClick={() => toggleSection('plotThreads')}
            className="w-full flex items-center justify-between p-4 hover:bg-void/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              <h4 className="text-lg font-bold text-gold">Plot Threads</h4>
              <span className="text-sm text-gray-400">
                ({Object.values(result.newState.plotThreads).filter((t) => t.status === 'active').length}{' '}
                active)
              </span>
            </div>
            {expandedSections.has('plotThreads') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('plotThreads') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-3"
              >
                {Object.entries(result.newState.plotThreads)
                  .filter(([_, thread]) => thread.status !== 'dormant')
                  .map(([threadId, thread]) => (
                    <div
                      key={threadId}
                      className="p-4 rounded-lg bg-void/30 border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-200">{threadId}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            thread.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {thread.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Tension:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  thread.tension > 70
                                    ? 'bg-red-500'
                                    : thread.tension > 40
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${thread.tension}%` }}
                              />
                            </div>
                            <span className="text-gray-200 w-8">{thread.tension}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Clues:</span>
                          <span className="text-gray-200">{thread.cluesDiscovered}</span>
                        </div>
                        {thread.keySuspects.length > 0 && (
                          <div>
                            <span className="text-gray-400">Suspects:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {thread.keySuspects.map((suspect) => (
                                <span
                                  key={suspect}
                                  className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300"
                                >
                                  {suspect}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
