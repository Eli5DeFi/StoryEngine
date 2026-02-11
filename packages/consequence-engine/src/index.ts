/**
 * Consequence Propagation Engine
 * 
 * Main entry point for the Consequence Propagation Engine package.
 * Exports all public APIs, types, and utilities.
 * 
 * @example
 * ```typescript
 * import { ConsequenceEngine, ConsequenceStorage } from '@voidborne/consequence-engine'
 * 
 * // Initialize engine
 * const storage = new ConsequenceStorage(prisma)
 * const state = await storage.getLatestState('story-123')
 * 
 * // Apply consequences after choice
 * const rules = await storage.loadRulesForChoice('story-123', 'choice-abc')
 * const result = await ConsequenceEngine.applyConsequences(state, 'choice-abc', rules)
 * 
 * if (result.success) {
 *   await storage.saveState(result.newState)
 *   console.log(`Applied ${result.appliedRules.length} rules`)
 * }
 * ```
 */

// Core engine
export { ConsequenceEngine } from './engine'
export { ConsequenceStorage } from './storage'

// Types
export type {
  NarrativeState,
  CharacterState,
  WorldState,
  PlotThread,
  ConsequenceRule,
  ConsequenceTriggerResult,
  MutationOperation,
  AIGenerationContext,
} from './types'

export {
  NarrativeStateSchema,
  CharacterStateSchema,
  WorldStateSchema,
  PlotThreadSchema,
  ConsequenceRuleSchema,
} from './types'

// Utilities
export { createExampleRules } from './examples'

// Version
export const VERSION = '0.1.0'
