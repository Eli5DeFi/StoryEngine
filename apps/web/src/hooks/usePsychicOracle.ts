'use client'

/**
 * @module usePsychicOracle
 * @description React hook for the Psychic Consensus Oracle (PCO).
 *
 * Manages all client-side state for the two-layer prediction market:
 *   Layer 1 — Story betting (which choice will AI select?)
 *   Layer 2 — Psychic betting (will the crowd be right?)
 *
 * Reads from on-chain (wagmi) for live pool state,
 * and from the REST API for leaderboard / historical data.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseAbi, parseUnits, formatUnits, type Address } from 'viem'
import { USDC_ADDRESS, ERC20_ABI } from '@/lib/contracts'

// ─── PCO Contract ABI (subset for reading) ───────────────────────────────────

const PCO_ABI = parseAbi([
  'function pools(uint256) view returns (uint256 chapterId, uint256 bettingDeadline, uint256 numChoices, uint256 totalBets, bool resolved, uint256 winningChoice, bool crowdWasRight, bool feesWithdrawn)',
  'function choiceBets(uint256 poolId, uint256 choice) view returns (uint256)',
  'function userBets(uint256 poolId, address user, uint256 choice) view returns (uint256)',
  'function userCrowdRight(uint256 poolId, address user) view returns (uint256)',
  'function userCrowdWrong(uint256 poolId, address user) view returns (uint256)',
  'function getOdds(uint256 poolId) view returns (uint256[] amounts, uint256[] pcts)',
  'function getConsensusState(uint256 poolId) view returns (uint256 crowdRightBets, uint256 crowdWrongBets, uint256 crowdRightPct, uint256 contraBonusMultiplier, bool resolved, bool crowdWasRight)',
  'function getPsychicProfile(address psychic) view returns (uint256 score, uint256 contraryWins, uint256 totalBetsPlaced, uint256 accuracy)',
  'function previewMainPayout(uint256 poolId, uint256 choice, uint256 amount) view returns (uint256)',
  'function mainClaimed(uint256, address) view returns (bool)',
  'function psychicClaimed(uint256, address) view returns (bool)',
  // Write
  'function betOnChoice(uint256 poolId, uint256 choice, uint256 amount) external',
  'function betOnConsensus(uint256 poolId, bool predictCrowdRight, uint256 amount) external',
  'function claimMainWinnings(uint256 poolId) external',
  'function claimPsychicWinnings(uint256 poolId) external',
])

// ─── Types ───────────────────────────────────────────────────────────────────

export type PsychicBadge = 'INITIATE' | 'SEER' | 'ORACLE' | 'PROPHET' | 'VOID_SEER'

export interface ChoiceState {
  index: number
  text: string
  totalBets: bigint
  oddsPercent: number
  payoutMultiplier: number
  isMajority: boolean
}

export interface ConsensusState {
  crowdRightBets: bigint
  crowdWrongBets: bigint
  crowdRightPercent: number   // 0–100
  psychicEdge: number         // contrarian EV / believer EV ratio
  resolved: boolean
  crowdWasRight?: boolean
}

export interface PsychicProfile {
  score: number
  contraryWins: number
  totalBets: number
  accuracy: number
  badge: PsychicBadge
  badgeEmoji: string
  feeDiscount: number   // bps off standard fee
}

export interface PoolState {
  chapterId: bigint
  bettingDeadline: Date
  numChoices: number
  totalBets: bigint
  resolved: boolean
  winningChoice?: number
  crowdWasRight?: boolean
  isOpen: boolean
}

export interface UsePsychicOracleReturn {
  // Pool data
  poolState: PoolState | null
  choices: ChoiceState[]
  consensus: ConsensusState | null
  profile: PsychicProfile | null

  // User positions
  myMainBets: bigint[]       // per-choice bet amounts
  myPsychicBetRight: bigint  // crowd-right bet
  myPsychicBetWrong: bigint  // contrarian bet

  // Claim status
  mainClaimed: boolean
  psychicClaimed: boolean

  // UI state
  loading: boolean
  error: string | null
  txPending: boolean
  txHash: `0x${string}` | undefined

  // Actions
  betOnChoice: (choice: number, amountUsdc: string) => Promise<void>
  betOnConsensus: (predictCrowdRight: boolean, amountUsdc: string) => Promise<void>
  claimMainWinnings: () => Promise<void>
  claimPsychicWinnings: () => Promise<void>
  refresh: () => void
  resetError: () => void
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function computeBadge(score: number): PsychicBadge {
  if (score >= 1750) return 'VOID_SEER'
  if (score >= 1500) return 'PROPHET'
  if (score >= 1250) return 'ORACLE'
  if (score >= 1000) return 'SEER'
  return 'INITIATE'
}

const BADGE_EMOJI: Record<PsychicBadge, string> = {
  INITIATE: '🌑',
  SEER: '🔮',
  ORACLE: '🌟',
  PROPHET: '🌌',
  VOID_SEER: '⚫',
}

const BADGE_FEE_DISCOUNT: Record<PsychicBadge, number> = {
  INITIATE: 0,
  SEER: 0,
  ORACLE: 50,    // -0.5%
  PROPHET: 100,  // -1%
  VOID_SEER: 200, // -2%
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePsychicOracle(
  contractAddress: Address,
  poolId: bigint,
  choiceTexts: string[],
): UsePsychicOracleReturn {
  const { address } = useAccount()

  const [error, setError] = useState<string | null>(null)
  const [txPending, setTxPending] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  // ── Write contract ──────────────────────────────────────────────────────
  const { writeContractAsync, data: txHash } = useWriteContract()
  const { isLoading: waitingForTx } = useWaitForTransactionReceipt({ hash: txHash })

  const isPending = txPending || waitingForTx

  // ── Read: pool state ────────────────────────────────────────────────────
  const { data: rawPool, refetch: refetchPool } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'pools',
    args: [poolId],
    query: { refetchInterval: 15_000 },
  })

  // ── Read: odds ──────────────────────────────────────────────────────────
  const { data: oddsData, refetch: refetchOdds } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'getOdds',
    args: [poolId],
    query: { refetchInterval: 10_000 },
  })

  // ── Read: consensus state ───────────────────────────────────────────────
  const { data: rawConsensus, refetch: refetchConsensus } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'getConsensusState',
    args: [poolId],
    query: { refetchInterval: 10_000 },
  })

  // ── Read: psychic profile ───────────────────────────────────────────────
  const { data: rawProfile, refetch: refetchProfile } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'getPsychicProfile',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 30_000 },
  })

  // ── Read: user main bet positions ───────────────────────────────────────
  const { data: userBet0 } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'userBets',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000', 0n],
    query: { enabled: !!address },
  })
  const { data: userBet1 } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'userBets',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000', 1n],
    query: { enabled: !!address },
  })
  const { data: userBet2 } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'userBets',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000', 2n],
    query: { enabled: !!address },
  })

  // ── Read: user psychic positions ────────────────────────────────────────
  const { data: myPsychicRight } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'userCrowdRight',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })
  const { data: myPsychicWrong } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'userCrowdWrong',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })

  // ── Read: claim status ──────────────────────────────────────────────────
  const { data: isMainClaimed } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'mainClaimed',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })
  const { data: isPsychicClaimed } = useReadContract({
    address: contractAddress,
    abi: PCO_ABI,
    functionName: 'psychicClaimed',
    args: [poolId, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })

  // ── Derived state ────────────────────────────────────────────────────────

  const poolState: PoolState | null = rawPool
    ? {
        chapterId: rawPool[0],
        bettingDeadline: new Date(Number(rawPool[1]) * 1000),
        numChoices: Number(rawPool[2]),
        totalBets: rawPool[3],
        resolved: rawPool[4],
        winningChoice: rawPool[4] ? Number(rawPool[5]) : undefined,
        crowdWasRight: rawPool[4] ? rawPool[6] : undefined,
        isOpen: !rawPool[4] && Date.now() < Number(rawPool[1]) * 1000,
      }
    : null

  const choices: ChoiceState[] = (() => {
    if (!oddsData || !poolState) return []
    const [amounts, pcts] = oddsData
    const majorityIndex = pcts.reduce(
      (maxIdx, pct, i) => (pct > pcts[maxIdx] ? i : maxIdx),
      0
    )
    return choiceTexts.slice(0, poolState.numChoices).map((text, i) => ({
      index: i,
      text,
      totalBets: amounts[i] ?? 0n,
      oddsPercent: Number(pcts[i] ?? 0n),
      payoutMultiplier:
        poolState.totalBets > 0n && (amounts[i] ?? 0n) > 0n
          ? Number(poolState.totalBets) / Number(amounts[i] ?? 1n)
          : 1,
      isMajority: i === majorityIndex,
    }))
  })()

  const consensus: ConsensusState | null = rawConsensus
    ? (() => {
        const [crowdRight, crowdWrong, crowdRightPct, , resolved, crowdWasRight] = rawConsensus
        const crPct = Number(crowdRightPct)
        const cwPct = 100 - crPct
        // Psychic Edge: ratio of contrarian EV to believer EV
        // EV_contrarian = 2 * (crowdWrong / total) wins when crowd fails
        // EV_believer   = 1 * (crowdRight / total) wins when crowd wins
        const totalPsychic = crowdRight + crowdWrong
        const psychicEdge =
          totalPsychic > 0n && crowdWrong > 0n && crowdRight > 0n
            ? (2 * Number(crowdWrong) * crPct) / (Number(crowdRight) * cwPct || 1)
            : 1
        return {
          crowdRightBets: crowdRight,
          crowdWrongBets: crowdWrong,
          crowdRightPercent: crPct,
          psychicEdge: Math.round(psychicEdge * 10) / 10,
          resolved,
          crowdWasRight: resolved ? crowdWasRight : undefined,
        }
      })()
    : null

  const profile: PsychicProfile | null = rawProfile
    ? (() => {
        const score = Number(rawProfile[0])
        const badge = computeBadge(score)
        return {
          score,
          contraryWins: Number(rawProfile[1]),
          totalBets: Number(rawProfile[2]),
          accuracy: Number(rawProfile[3]),
          badge,
          badgeEmoji: BADGE_EMOJI[badge],
          feeDiscount: BADGE_FEE_DISCOUNT[badge],
        }
      })()
    : null

  // ── USDC Approve helper ─────────────────────────────────────────────────
  async function ensureApproval(amountWei: bigint) {
    if (!address) throw new Error('Wallet not connected')
    // Simple approval — in production check allowance first
    await writeContractAsync({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contractAddress, amountWei],
    })
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  const betOnChoice = useCallback(
    async (choice: number, amountUsdc: string) => {
      if (!address) { setError('Connect your wallet first'); return }
      if (!poolState?.isOpen) { setError('Betting is closed'); return }
      setError(null)
      setTxPending(true)
      try {
        const amount = parseUnits(amountUsdc, 6)
        await ensureApproval(amount)
        await writeContractAsync({
          address: contractAddress,
          abi: PCO_ABI,
          functionName: 'betOnChoice',
          args: [poolId, BigInt(choice), amount],
        })
        setRefreshTick(t => t + 1)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Transaction failed')
      } finally {
        setTxPending(false)
      }
    },
    [address, contractAddress, poolId, poolState]
  )

  const betOnConsensus = useCallback(
    async (predictCrowdRight: boolean, amountUsdc: string) => {
      if (!address) { setError('Connect your wallet first'); return }
      if (!poolState?.isOpen) { setError('Betting is closed'); return }
      setError(null)
      setTxPending(true)
      try {
        const amount = parseUnits(amountUsdc, 6)
        await ensureApproval(amount)
        await writeContractAsync({
          address: contractAddress,
          abi: PCO_ABI,
          functionName: 'betOnConsensus',
          args: [poolId, predictCrowdRight, amount],
        })
        setRefreshTick(t => t + 1)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Transaction failed')
      } finally {
        setTxPending(false)
      }
    },
    [address, contractAddress, poolId, poolState]
  )

  const claimMainWinnings = useCallback(async () => {
    if (!address) { setError('Connect your wallet first'); return }
    setError(null)
    setTxPending(true)
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: PCO_ABI,
        functionName: 'claimMainWinnings',
        args: [poolId],
      })
      setRefreshTick(t => t + 1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Claim failed')
    } finally {
      setTxPending(false)
    }
  }, [address, contractAddress, poolId])

  const claimPsychicWinnings = useCallback(async () => {
    if (!address) { setError('Connect your wallet first'); return }
    setError(null)
    setTxPending(true)
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: PCO_ABI,
        functionName: 'claimPsychicWinnings',
        args: [poolId],
      })
      setRefreshTick(t => t + 1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Claim failed')
    } finally {
      setTxPending(false)
    }
  }, [address, contractAddress, poolId])

  const refresh = useCallback(() => {
    refetchPool()
    refetchOdds()
    refetchConsensus()
    refetchProfile()
  }, [refetchPool, refetchOdds, refetchConsensus, refetchProfile])

  return {
    poolState,
    choices,
    consensus,
    profile,
    myMainBets: [userBet0 ?? 0n, userBet1 ?? 0n, userBet2 ?? 0n],
    myPsychicBetRight: myPsychicRight ?? 0n,
    myPsychicBetWrong: myPsychicWrong ?? 0n,
    mainClaimed: isMainClaimed ?? false,
    psychicClaimed: isPsychicClaimed ?? false,
    loading: !rawPool,
    error,
    txPending: isPending,
    txHash,
    betOnChoice,
    betOnConsensus,
    claimMainWinnings,
    claimPsychicWinnings,
    refresh,
    resetError: () => setError(null),
  }
}
