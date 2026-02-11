/**
 * Consequence Propagation Engine - Database Storage Layer
 * 
 * Handles persistence of narrative states and consequence rules.
 */

import { PrismaClient } from '@prisma/client'
import { NarrativeState, ConsequenceRule } from './types'
import { ConsequenceEngine } from './engine'

export class ConsequenceStorage {
  constructor(private prisma: PrismaClient) {}

  /**
   * Save narrative state to database
   */
  async saveState(state: NarrativeState): Promise<void> {
    await this.prisma.narrativeState.upsert({
      where: {
        storyId_chapterNumber: {
          storyId: state.storyId,
          chapterNumber: state.chapterNumber,
        },
      },
      create: {
        storyId: state.storyId,
        chapterNumber: state.chapterNumber,
        state: state as any, // Prisma Json type
      },
      update: {
        state: state as any,
      },
    })
  }

  /**
   * Load narrative state from database
   */
  async loadState(storyId: string, chapterNumber: number): Promise<NarrativeState | null> {
    const record = await this.prisma.narrativeState.findUnique({
      where: {
        storyId_chapterNumber: {
          storyId,
          chapterNumber,
        },
      },
    })

    if (!record) return null

    return record.state as any as NarrativeState
  }

  /**
   * Get latest narrative state for a story
   */
  async getLatestState(storyId: string): Promise<NarrativeState | null> {
    const record = await this.prisma.narrativeState.findFirst({
      where: { storyId },
      orderBy: { chapterNumber: 'desc' },
    })

    if (!record) {
      // Initialize new state
      const initialState = ConsequenceEngine.initializeState(storyId)
      await this.saveState(initialState)
      return initialState
    }

    return record.state as any as NarrativeState
  }

  /**
   * Save consequence rule
   */
  async saveRule(rule: ConsequenceRule): Promise<void> {
    await this.prisma.consequenceRule.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        storyId: rule.storyId,
        name: rule.name,
        description: rule.description,
        triggerChoiceId: rule.triggerChoiceId,
        triggerChapter: rule.triggerChapter,
        mutations: rule.mutations as any,
        conditions: rule.conditions as any,
        futureRequirements: rule.futureRequirements as any,
        displayText: rule.displayText,
        severity: rule.severity,
      },
      update: {
        name: rule.name,
        description: rule.description,
        mutations: rule.mutations as any,
        conditions: rule.conditions as any,
        futureRequirements: rule.futureRequirements as any,
        displayText: rule.displayText,
        severity: rule.severity,
      },
    })
  }

  /**
   * Load all rules for a story
   */
  async loadRules(storyId: string): Promise<ConsequenceRule[]> {
    const records = await this.prisma.consequenceRule.findMany({
      where: { storyId },
    })

    return records.map(record => ({
      id: record.id,
      name: record.name,
      description: record.description,
      storyId: record.storyId,
      triggerChoiceId: record.triggerChoiceId,
      triggerChapter: record.triggerChapter,
      mutations: record.mutations as any,
      conditions: record.conditions as any,
      futureRequirements: record.futureRequirements as any,
      displayText: record.displayText || undefined,
      severity: record.severity as any,
    }))
  }

  /**
   * Load rules for a specific choice
   */
  async loadRulesForChoice(storyId: string, choiceId: string): Promise<ConsequenceRule[]> {
    const records = await this.prisma.consequenceRule.findMany({
      where: {
        storyId,
        triggerChoiceId: choiceId,
      },
    })

    return records.map(record => ({
      id: record.id,
      name: record.name,
      description: record.description,
      storyId: record.storyId,
      triggerChoiceId: record.triggerChoiceId,
      triggerChapter: record.triggerChapter,
      mutations: record.mutations as any,
      conditions: record.conditions as any,
      futureRequirements: record.futureRequirements as any,
      displayText: record.displayText || undefined,
      severity: record.severity as any,
    }))
  }

  /**
   * Delete a consequence rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await this.prisma.consequenceRule.delete({
      where: { id: ruleId },
    })
  }

  /**
   * Get state history for a story
   */
  async getStateHistory(storyId: string): Promise<NarrativeState[]> {
    const records = await this.prisma.narrativeState.findMany({
      where: { storyId },
      orderBy: { chapterNumber: 'asc' },
    })

    return records.map(r => r.state as any as NarrativeState)
  }

  /**
   * Clone state to a new chapter (for advancing the narrative)
   */
  async advanceState(storyId: string, fromChapter: number, toChapter: number): Promise<NarrativeState> {
    const currentState = await this.loadState(storyId, fromChapter)
    if (!currentState) {
      throw new Error(`State not found for chapter ${fromChapter}`)
    }

    const newState: NarrativeState = {
      ...currentState,
      chapterNumber: toChapter,
      timestamp: new Date(),
    }

    await this.saveState(newState)
    return newState
  }
}
