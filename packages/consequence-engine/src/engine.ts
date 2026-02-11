/**
 * Consequence Propagation Engine - Core Engine
 * 
 * Handles narrative state mutations, consequence rule evaluation,
 * and propagation of choice outcomes across chapters.
 */

import {
  NarrativeState,
  NarrativeStateSchema,
  ConsequenceRule,
  ConsequenceRuleSchema,
  ConsequenceTriggerResult,
  MutationOperation,
  AIGenerationContext,
  CharacterState,
  WorldState,
  PlotThread,
} from './types'

export class ConsequenceEngine {
  /**
   * Initialize narrative state for a new story
   */
  static initializeState(storyId: string): NarrativeState {
    return NarrativeStateSchema.parse({
      storyId,
      chapterNumber: 0,
      characters: {},
      world: {},
      plotThreads: {},
      metadata: {
        totalChoicesMade: 0,
        majorBranches: [],
      },
    })
  }

  /**
   * Apply consequence rules after a choice is made
   */
  static async applyConsequences(
    currentState: NarrativeState,
    choiceId: string,
    rules: ConsequenceRule[]
  ): Promise<ConsequenceTriggerResult> {
    const result: ConsequenceTriggerResult = {
      success: true,
      appliedRules: [],
      newState: JSON.parse(JSON.stringify(currentState)), // Deep clone
      changes: [],
      errors: [],
    }

    try {
      // Filter rules that match this choice
      const matchingRules = rules.filter(rule => rule.triggerChoiceId === choiceId)

      for (const rule of matchingRules) {
        // Check conditions
        if (rule.conditions && !this.evaluateConditions(result.newState, rule.conditions)) {
          continue
        }

        // Apply mutations
        for (const mutation of rule.mutations) {
          const change = this.applyMutation(result.newState, mutation)
          if (change) {
            result.changes.push(change)
          }
        }

        result.appliedRules.push(rule)
      }

      // Update metadata
      result.newState.metadata.totalChoicesMade++
      result.newState.metadata.lastUpdatedBy = choiceId
      result.newState.timestamp = new Date()

      // Validate new state
      result.newState = NarrativeStateSchema.parse(result.newState)

    } catch (error: any) {
      result.success = false
      result.errors = [error.message]
    }

    return result
  }

  /**
   * Evaluate rule conditions against current state
   */
  private static evaluateConditions(
    state: NarrativeState,
    conditions: NonNullable<ConsequenceRule['conditions']>
  ): boolean {
    for (const condition of conditions) {
      const value = this.getValueAtPath(state, condition.path)
      
      switch (condition.operator) {
        case 'eq':
          if (value !== condition.value) return false
          break
        case 'neq':
          if (value === condition.value) return false
          break
        case 'gt':
          if (!(value > condition.value)) return false
          break
        case 'gte':
          if (!(value >= condition.value)) return false
          break
        case 'lt':
          if (!(value < condition.value)) return false
          break
        case 'lte':
          if (!(value <= condition.value)) return false
          break
        case 'contains':
          if (Array.isArray(value) && !value.includes(condition.value)) return false
          if (typeof value === 'string' && !value.includes(condition.value)) return false
          break
        case 'notContains':
          if (Array.isArray(value) && value.includes(condition.value)) return false
          if (typeof value === 'string' && value.includes(condition.value)) return false
          break
      }
    }

    return true
  }

  /**
   * Apply a single mutation to the state
   */
  private static applyMutation(
    state: NarrativeState,
    mutation: MutationOperation
  ): { path: string; oldValue: any; newValue: any; operation: string } | null {
    const oldValue = this.getValueAtPath(state, mutation.path)

    switch (mutation.op) {
      case 'set':
        this.setValueAtPath(state, mutation.path, mutation.value)
        break
      
      case 'add':
        const currentNum = Number(oldValue) || 0
        this.setValueAtPath(state, mutation.path, currentNum + mutation.value)
        break
      
      case 'subtract':
        const currentNum2 = Number(oldValue) || 0
        this.setValueAtPath(state, mutation.path, currentNum2 - mutation.value)
        break
      
      case 'multiply':
        const currentNum3 = Number(oldValue) || 0
        this.setValueAtPath(state, mutation.path, currentNum3 * mutation.value)
        break
      
      case 'append':
        if (Array.isArray(oldValue)) {
          this.setValueAtPath(state, mutation.path, [...oldValue, mutation.value])
        } else {
          this.setValueAtPath(state, mutation.path, [mutation.value])
        }
        break
      
      case 'remove':
        if (Array.isArray(oldValue)) {
          this.setValueAtPath(
            state,
            mutation.path,
            oldValue.filter(v => v !== mutation.value)
          )
        }
        break
      
      case 'toggle':
        if (typeof oldValue === 'boolean') {
          this.setValueAtPath(state, mutation.path, !oldValue)
        }
        break
      
      default:
        return null
    }

    const newValue = this.getValueAtPath(state, mutation.path)

    return {
      path: mutation.path,
      oldValue,
      newValue,
      operation: mutation.op,
    }
  }

  /**
   * Get value at a nested path (e.g., "characters.lord-kaelen.reputation")
   */
  private static getValueAtPath(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current === null || current === undefined) return undefined
      current = current[key]
    }

    return current
  }

  /**
   * Set value at a nested path, creating intermediate objects if needed
   */
  private static setValueAtPath(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let current = obj

    // Create intermediate objects
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    current[lastKey] = value
  }

  /**
   * Generate AI context from current narrative state
   */
  static generateAIContext(
    state: NarrativeState,
    targetChapter: number,
    rules: ConsequenceRule[]
  ): AIGenerationContext {
    const activeConstraints: string[] = []
    const characterArcs: AIGenerationContext['characterArcs'] = []

    // Collect future requirements for this chapter
    for (const rule of rules) {
      if (rule.futureRequirements?.[targetChapter]) {
        activeConstraints.push(...rule.futureRequirements[targetChapter])
      }
    }

    // Analyze character states
    for (const [charId, charState] of Object.entries(state.characters)) {
      let suggestedDirection = 'neutral'
      
      if (charState.reputation < -40) {
        suggestedDirection = 'antagonist - seeking revenge or redemption'
      } else if (charState.reputation > 40) {
        suggestedDirection = 'ally - offering support or requesting favors'
      }

      if (charState.traumaticEvents.length > 0) {
        suggestedDirection += ' (traumatized, unstable)'
      }

      characterArcs.push({
        characterId: charId,
        currentArc: `Rep: ${charState.reputation}, Power: ${charState.powerLevel}`,
        suggestedDirection,
      })
    }

    // Generate plot suggestions
    const suggestedPlotPoints: string[] = []
    
    if (state.world.politicalTension > 70) {
      suggestedPlotPoints.push('Political conflict escalating - create confrontation scene')
    }
    
    if (state.world.economicStability < 30) {
      suggestedPlotPoints.push('Economic crisis - resource scarcity affects characters')
    }

    for (const [threadId, thread] of Object.entries(state.plotThreads)) {
      if (thread.status === 'active' && thread.tension > 70) {
        suggestedPlotPoints.push(`${threadId} requires resolution - tension critical`)
      }
    }

    return {
      currentState: state,
      activeConstraints,
      suggestedPlotPoints,
      characterArcs,
    }
  }

  /**
   * Format state for AI prompt injection
   */
  static formatForPrompt(context: AIGenerationContext): string {
    let prompt = '=== NARRATIVE STATE ===\n\n'

    // Characters
    prompt += '## Characters:\n'
    for (const [charId, char] of Object.entries(context.currentState.characters)) {
      prompt += `\n**${charId}**:\n`
      prompt += `- Alive: ${char.alive}\n`
      prompt += `- Reputation: ${char.reputation}/100 (${this.reputationLabel(char.reputation)})\n`
      prompt += `- Location: ${char.location}\n`
      prompt += `- Power Level: ${char.powerLevel}/100\n`
      
      if (Object.keys(char.relationships).length > 0) {
        prompt += `- Relationships:\n`
        for (const [otherChar, score] of Object.entries(char.relationships)) {
          prompt += `  - ${otherChar}: ${score}/100 (${this.relationshipLabel(score)})\n`
        }
      }
      
      if (char.traumaticEvents.length > 0) {
        prompt += `- Trauma: ${char.traumaticEvents.join(', ')}\n`
      }
    }

    // World state
    prompt += '\n## World State:\n'
    prompt += `- Political Tension: ${context.currentState.world.politicalTension}/100\n`
    prompt += `- Economic Stability: ${context.currentState.world.economicStability}/100\n`
    
    if (Object.keys(context.currentState.world.factionInfluence).length > 0) {
      prompt += '- Faction Influence:\n'
      for (const [faction, influence] of Object.entries(context.currentState.world.factionInfluence)) {
        prompt += `  - ${faction}: ${influence}/100\n`
      }
    }

    if (context.currentState.world.activeWars.length > 0) {
      prompt += `- Active Wars: ${context.currentState.world.activeWars.join(', ')}\n`
    }

    // Plot threads
    if (Object.keys(context.currentState.plotThreads).length > 0) {
      prompt += '\n## Active Plot Threads:\n'
      for (const [threadId, thread] of Object.entries(context.currentState.plotThreads)) {
        if (thread.status !== 'dormant') {
          prompt += `\n**${threadId}**:\n`
          prompt += `- Status: ${thread.status}\n`
          prompt += `- Tension: ${thread.tension}/100\n`
          prompt += `- Clues: ${thread.cluesDiscovered}\n`
        }
      }
    }

    // Constraints
    if (context.activeConstraints.length > 0) {
      prompt += '\n## MANDATORY REQUIREMENTS:\n'
      for (const constraint of context.activeConstraints) {
        prompt += `- ${constraint}\n`
      }
    }

    // Suggestions
    if (context.suggestedPlotPoints.length > 0) {
      prompt += '\n## Suggested Plot Developments:\n'
      for (const suggestion of context.suggestedPlotPoints) {
        prompt += `- ${suggestion}\n`
      }
    }

    // Character arcs
    if (context.characterArcs.length > 0) {
      prompt += '\n## Character Arc Suggestions:\n'
      for (const arc of context.characterArcs) {
        prompt += `- ${arc.characterId}: ${arc.suggestedDirection}\n`
      }
    }

    prompt += '\n=== END NARRATIVE STATE ===\n'

    return prompt
  }

  /**
   * Helper: Convert reputation score to label
   */
  private static reputationLabel(score: number): string {
    if (score >= 80) return 'Legendary Hero'
    if (score >= 60) return 'Highly Respected'
    if (score >= 40) return 'Well Regarded'
    if (score >= 20) return 'Favorable'
    if (score >= -20) return 'Neutral'
    if (score >= -40) return 'Distrusted'
    if (score >= -60) return 'Despised'
    return 'Mortal Enemy'
  }

  /**
   * Helper: Convert relationship score to label
   */
  private static relationshipLabel(score: number): string {
    if (score >= 80) return 'Devoted Ally'
    if (score >= 60) return 'Close Friend'
    if (score >= 40) return 'Friendly'
    if (score >= 20) return 'Cordial'
    if (score >= -20) return 'Neutral'
    if (score >= -40) return 'Unfriendly'
    if (score >= -60) return 'Hostile'
    return 'Bitter Enemy'
  }

  /**
   * Validate rule definition
   */
  static validateRule(rule: ConsequenceRule): { valid: boolean; errors: string[] } {
    try {
      ConsequenceRuleSchema.parse(rule)
      return { valid: true, errors: [] }
    } catch (error: any) {
      return {
        valid: false,
        errors: error.errors?.map((e: any) => e.message) || [error.message],
      }
    }
  }
}
