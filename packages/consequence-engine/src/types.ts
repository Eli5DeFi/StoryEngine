/**
 * Consequence Propagation Engine - Type Definitions
 * 
 * Defines the narrative state structure and consequence rules
 * that govern how choices ripple through future chapters.
 */

import { z } from 'zod'

// ============================================================================
// Character State
// ============================================================================

export const CharacterStateSchema = z.object({
  alive: z.boolean().default(true),
  reputation: z.number().min(-100).max(100).default(0), // Public opinion
  location: z.string().default('unknown'),
  relationships: z.record(z.string(), z.number().min(-100).max(100)).default({}), // characterId -> friendship score
  traumaticEvents: z.array(z.string()).default([]),
  secrets: z.array(z.string()).default([]),
  powerLevel: z.number().min(0).max(100).default(50), // Combat/influence strength
})

export type CharacterState = z.infer<typeof CharacterStateSchema>

// ============================================================================
// World State
// ============================================================================

export const WorldStateSchema = z.object({
  politicalTension: z.number().min(0).max(100).default(0),
  economicStability: z.number().min(0).max(100).default(50),
  factionInfluence: z.record(z.string(), z.number().min(0).max(100)).default({}),
  activeWars: z.array(z.string()).default([]),
  discoveredTechnologies: z.array(z.string()).default([]),
  cosmicAnomalies: z.array(z.string()).default([]),
  environmentalHazards: z.array(z.string()).default([]),
})

export type WorldState = z.infer<typeof WorldStateSchema>

// ============================================================================
// Plot Thread State
// ============================================================================

export const PlotThreadSchema = z.object({
  status: z.enum(['dormant', 'active', 'resolved']).default('dormant'),
  tension: z.number().min(0).max(100).default(0),
  keySuspects: z.array(z.string()).default([]),
  cluesDiscovered: z.number().default(0),
  chapters: z.array(z.number()).default([]), // Chapters where this thread appears
})

export type PlotThread = z.infer<typeof PlotThreadSchema>

// ============================================================================
// Complete Narrative State
// ============================================================================

export const NarrativeStateSchema = z.object({
  storyId: z.string(),
  chapterNumber: z.number().int().positive(),
  version: z.number().int().default(1),
  timestamp: z.date().default(() => new Date()),
  
  characters: z.record(z.string(), CharacterStateSchema).default({}),
  world: WorldStateSchema.default({}),
  plotThreads: z.record(z.string(), PlotThreadSchema).default({}),
  
  // Metadata
  metadata: z.object({
    totalChoicesMade: z.number().default(0),
    lastUpdatedBy: z.string().optional(), // choiceId
    majorBranches: z.array(z.string()).default([]), // Key decision points
  }).default({}),
})

export type NarrativeState = z.infer<typeof NarrativeStateSchema>

// ============================================================================
// Consequence Rules
// ============================================================================

export type MutationOperation = 
  | { op: 'set'; path: string; value: any }
  | { op: 'add'; path: string; value: number }
  | { op: 'subtract'; path: string; value: number }
  | { op: 'multiply'; path: string; value: number }
  | { op: 'append'; path: string; value: any }
  | { op: 'remove'; path: string; value: any }
  | { op: 'toggle'; path: string }

export interface ConsequenceRule {
  id: string
  name: string
  description: string
  storyId: string
  
  // Trigger
  triggerChoiceId: string
  triggerChapter: number
  
  // Conditions (optional - must all be true)
  conditions?: {
    path: string // e.g., "characters.lord-kaelen.reputation"
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains'
    value: any
  }[]
  
  // State mutations
  mutations: MutationOperation[]
  
  // Future chapter requirements
  futureRequirements?: Record<number, string[]> // chapter -> requirements
  
  // UI Display
  displayText?: string // "Lord Kaelen now distrusts you"
  severity?: 'minor' | 'moderate' | 'major' | 'critical'
}

export const ConsequenceRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  storyId: z.string(),
  triggerChoiceId: z.string(),
  triggerChapter: z.number().int().positive(),
  conditions: z.array(z.object({
    path: z.string(),
    operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'notContains']),
    value: z.any(),
  })).optional(),
  mutations: z.array(z.any()),
  futureRequirements: z.record(z.string(), z.array(z.string())).optional(),
  displayText: z.string().optional(),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']).optional(),
})

// ============================================================================
// Consequence Trigger Result
// ============================================================================

export interface ConsequenceTriggerResult {
  success: boolean
  appliedRules: ConsequenceRule[]
  newState: NarrativeState
  changes: {
    path: string
    oldValue: any
    newValue: any
    operation: string
  }[]
  errors?: string[]
}

// ============================================================================
// AI Generation Context
// ============================================================================

export interface AIGenerationContext {
  currentState: NarrativeState
  activeConstraints: string[]
  suggestedPlotPoints: string[]
  characterArcs: {
    characterId: string
    currentArc: string
    suggestedDirection: string
  }[]
}
