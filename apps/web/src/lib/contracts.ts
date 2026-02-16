// Contract addresses (Local Anvil - Chain ID 31337)
export const BETTING_POOL_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}` // Local deployment
export const USDC_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}` // Local MockUSDC

// Legacy CONTRACTS object for backward compatibility
// TODO: Remove after migrating all hooks to named exports
export const CONTRACTS = {
  usdc: USDC_ADDRESS,
  forgeToken: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy
  bettingPool: BETTING_POOL_ADDRESS,
}

// Utility functions for token formatting
export function formatUSDC(value: bigint): string {
  // USDC has 6 decimals
  const formatted = Number(value) / 1_000_000
  return formatted.toFixed(2)
}

export function formatForge(value: bigint): string {
  // FORGE has 18 decimals (standard ERC20)
  const formatted = Number(value) / 1e18
  return formatted.toFixed(4)
}

export function parseUSDC(value: string): bigint {
  // USDC has 6 decimals
  const num = parseFloat(value)
  return BigInt(Math.floor(num * 1_000_000))
}

// ABIs
export const BETTING_POOL_ABI = [
  // Read Functions
  {
    inputs: [{ name: 'chapterId', type: 'uint256' }],
    name: 'isBettingOpen',
    outputs: [{ name: 'isOpen', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'chapterId', type: 'uint256' }],
    name: 'getTimeUntilDeadline',
    outputs: [{ name: 'timeRemaining', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'chapterId', type: 'uint256' }],
    name: 'getChapterSchedule',
    outputs: [
      { name: 'generationTime', type: 'uint256' },
      { name: 'bettingDeadline', type: 'uint256' },
      { name: 'published', type: 'bool' },
      { name: 'bettingOpen', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'outcomeIds', type: 'uint256[]' }],
    name: 'calculateCombinedOdds',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'outcomeId', type: 'uint256' }],
    name: 'getOddsForOutcome',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'outcomeId', type: 'uint256' }],
    name: 'getOutcome',
    outputs: [
      { name: 'outcomeType', type: 'uint8' },
      { name: 'description', type: 'string' },
      { name: 'chapterId', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'totalBets', type: 'uint256' },
      { name: 'numBets', type: 'uint256' },
      { name: 'bettingDeadline', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserBets',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'betId', type: 'uint256' }],
    name: 'getBet',
    outputs: [
      { name: 'bettor', type: 'address' },
      { name: 'outcomeIds', type: 'uint256[]' },
      { name: 'amount', type: 'uint256' },
      { name: 'combinedOdds', type: 'uint256' },
      { name: 'betType', type: 'uint8' },
      { name: 'settled', type: 'bool' },
      { name: 'won', type: 'bool' },
      { name: 'payout', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write Functions
  {
    inputs: [
      { name: 'chapterId', type: 'uint256' },
      { name: 'generationTime', type: 'uint256' },
    ],
    name: 'scheduleChapter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'outcomeType', type: 'uint8' },
      { name: 'description', type: 'string' },
      { name: 'chapterId', type: 'uint256' },
      { name: 'choiceId', type: 'uint256' },
    ],
    name: 'createOutcome',
    outputs: [{ name: 'outcomeId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'outcomeIds', type: 'uint256[]' },
      { name: 'amount', type: 'uint256' },
      { name: 'betType', type: 'uint8' },
    ],
    name: 'placeCombiBet',
    outputs: [{ name: 'betId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'outcomeId', type: 'uint256' },
      { name: 'occurred', type: 'bool' },
    ],
    name: 'resolveOutcome',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'betId', type: 'uint256' }],
    name: 'settleBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'betIds', type: 'uint256[]' }],
    name: 'settleBetBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'chapterId', type: 'uint256' },
      { name: 'newGenerationTime', type: 'uint256' },
    ],
    name: 'extendDeadline',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'chapterId', type: 'uint256' }],
    name: 'markChapterPublished',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'chapterId', type: 'uint256' },
      { indexed: false, name: 'generationTime', type: 'uint256' },
      { indexed: false, name: 'bettingDeadline', type: 'uint256' },
    ],
    name: 'ChapterScheduled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'betId', type: 'uint256' },
      { indexed: true, name: 'bettor', type: 'address' },
      { indexed: false, name: 'outcomeIds', type: 'uint256[]' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'combinedOdds', type: 'uint256' },
      { indexed: false, name: 'betType', type: 'uint8' },
    ],
    name: 'CombiBetPlaced',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'outcomeId', type: 'uint256' },
      { indexed: false, name: 'occurred', type: 'bool' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'OutcomeResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'betId', type: 'uint256' },
      { indexed: true, name: 'bettor', type: 'address' },
      { indexed: false, name: 'won', type: 'bool' },
      { indexed: false, name: 'payout', type: 'uint256' },
    ],
    name: 'BetSettled',
    type: 'event',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
