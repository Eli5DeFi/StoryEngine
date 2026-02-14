/**
 * Betting Components Index
 * 
 * Use lazy-loaded exports for chart components to reduce bundle size.
 * Other components are eagerly loaded.
 */

// Lazy-loaded components (heavy dependencies: recharts, framer-motion)
export { LiveOddsChart } from './LiveOddsChart.lazy'
export { OddsChart } from './OddsChart.lazy'

// Eagerly-loaded components
export { ConsensusGauge } from './ConsensusGauge'
export { RecentActivityFeed } from './RecentActivityFeed'
export { StreakBrokenModal } from './StreakBrokenModal'
export { MarketSentiment } from './MarketSentiment'
