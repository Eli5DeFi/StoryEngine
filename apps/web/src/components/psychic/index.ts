/**
 * @module components/psychic
 * @description Psychic Consensus Oracle (PCO) UI components — Innovation Cycle 48.
 *
 * The PCO adds a two-layer prediction market to Voidborne:
 *   Layer 1 — Story betting (which choice will AI pick?)
 *   Layer 2 — Meta-bet (will the crowd be right?)
 *
 * Correct contrarians earn 2× bonus payout + ELO score advances.
 */

export { PsychicConsensusPanel } from './PsychicConsensusPanel'
export type { PsychicConsensusPanelProps } from './PsychicConsensusPanel'

export { PsychicLeaderboard } from './PsychicLeaderboard'
export type { PsychicLeaderboardProps, LeaderboardEntry } from './PsychicLeaderboard'
