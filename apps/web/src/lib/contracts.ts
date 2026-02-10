/**
 * Smart contract utilities and ABIs
 */

import { Address } from 'viem'

// Contract addresses (set from environment)
export const CONTRACTS = {
  // Betting currency (USDC on Base)
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS || '') as Address,
  
  // $FORGE token (for trading fees → AI compute funding)
  forgeToken: (process.env.NEXT_PUBLIC_FORGE_TOKEN_ADDRESS || '') as Address,
  
  // Betting pool contract
  bettingPool: (process.env.NEXT_PUBLIC_BETTING_POOL_ADDRESS || '') as Address,
} as const

// ChapterBettingPool ABI (updated for constructor params)
export const BETTING_POOL_ABI = [
  {
    inputs: [
      { name: '_branchIndex', type: 'uint8' },
      { name: '_amount', type: 'uint256' },
      { name: '_isAgent', type: 'bool' },
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'getPendingReward',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_branchIndex', type: 'uint8' }],
    name: 'getBranchOdds',
    outputs: [{ name: 'impliedOdds', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_branchIndex', type: 'uint8' }],
    name: 'getBranchInfo',
    outputs: [
      { name: 'hash', type: 'string' },
      { name: 'total', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPoolAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'state',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bettingDeadline',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'winningBranch',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'branchCount',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minBet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxBet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ERC-20 ABI (for USDC and $FORGE)
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
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Pool states (matches Solidity enum)
export enum PoolState {
  OPEN = 0,
  LOCKED = 1,
  SETTLED = 2,
  CANCELLED = 3,
}

// Helper to format USDC amounts (6 decimals)
export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2)
}

// Helper to parse USDC amounts (6 decimals)
export function parseUSDC(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e6))
}

// Helper to format FORGE amounts (18 decimals)
export function formatForge(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(6)
}

// Helper to parse FORGE amounts (18 decimals)
export function parseForge(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18))
}

// Helper to format odds (basis points → percentage)
export function formatOdds(bps: bigint): string {
  return (Number(bps) / 100).toFixed(1) + '%'
}
