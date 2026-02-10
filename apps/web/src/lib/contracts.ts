/**
 * Smart contract utilities and ABIs
 */

import { Address } from 'viem'

// Contract addresses (set from environment)
export const CONTRACTS = {
  forgeToken: (process.env.NEXT_PUBLIC_FORGE_TOKEN_ADDRESS || '') as Address,
  bettingPool: (process.env.NEXT_PUBLIC_BETTING_POOL_ADDRESS || '') as Address,
} as const

// ChapterBettingPool ABI (minimal, add more as needed)
export const BETTING_POOL_ABI = [
  {
    inputs: [
      { name: '_storyId', type: 'string' },
      { name: '_chapterId', type: 'uint256' },
      { name: '_closingTime', type: 'uint256' },
      { name: '_minBet', type: 'uint256' },
    ],
    name: 'createPool',
    outputs: [{ name: 'poolId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_choiceIndex', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }],
    name: 'getPool',
    outputs: [
      {
        components: [
          { name: 'storyId', type: 'string' },
          { name: 'chapterId', type: 'uint256' },
          { name: 'closingTime', type: 'uint256' },
          { name: 'totalPool', type: 'uint256' },
          { name: 'isResolved', type: 'bool' },
          { name: 'winningChoice', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_winningChoice', type: 'uint256' },
    ],
    name: 'resolvePool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// ERC-20 ABI (for $FORGE token)
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
      { name: 'spender', type: 'address' },
      { name: 'owner', type: 'address' },
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

// Helper to format FORGE amounts (18 decimals)
export function formatForge(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(6)
}

// Helper to parse FORGE amounts (18 decimals)
export function parseForge(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18))
}
