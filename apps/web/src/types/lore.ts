/**
 * Voidborne Lore Types
 * Types for Houses, Protocols, and Characters from the database
 */

export interface House {
  id: string
  slug: string
  name: string
  description: string
  lore: string
  primaryColor: string
  secondaryColor?: string
  icon?: string
  bannerImage?: string
  strandType: string
  strandDescription: string
  territory?: string
  population?: number
  influence: number
  reputation: number
  totalMembers: number
  totalBets: number
  totalWins: number
  winRate: number
  protocols: ProtocolSummary[]
  memberCount: number
  protocolCount: number
  createdAt: string
  updatedAt: string
}

export interface ProtocolSummary {
  id: string
  slug: string
  code: string
  name: string
  rarity: ProtocolRarity
  powerLevel: number
}

export interface Protocol {
  id: string
  slug: string
  code: string
  name: string
  description: string
  lore: string
  houseId: string
  house: {
    id: string
    slug: string
    name: string
    primaryColor: string
    icon?: string
  }
  strandType: string
  spectrum: string
  orderRange: string
  cost: string
  effects: string
  risks?: string
  rarity: ProtocolRarity
  powerLevel: number
  timesUsed: number
  successRate: number
  icon?: string
  color?: string
  createdAt: string
  updatedAt: string
}

export type ProtocolRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}
