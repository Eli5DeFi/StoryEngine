import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi, type Address } from 'viem'
import { baseSepolia, base } from 'viem/chains'

/**
 * GET /api/psychic/leaderboard
 *
 * Returns the Psychic Consensus Oracle leaderboard.
 *
 * Strategy:
 *   1. Read known bettor addresses from the DB (all users who have ever bet)
 *   2. Batch-query getPsychicProfile() on-chain for each address
 *   3. Sort by ELO score, return top N
 *
 * Query params:
 *   limit  - number of entries to return (default 10)
 *   user   - wallet address to also fetch (returned as myEntry, even if outside top N)
 *
 * @note On-chain reads are cached for 60s via Cache-Control header.
 */

export const dynamic = 'force-dynamic'

// ─── ABI ─────────────────────────────────────────────────────────────────────

const PCO_ABI = parseAbi([
  'function getPsychicProfile(address psychic) view returns (uint256 score, uint256 contraryWins, uint256 totalBetsPlaced, uint256 accuracy)',
])

// ─── Config ───────────────────────────────────────────────────────────────────

const PCO_ADDRESS = (process.env.NEXT_PUBLIC_PCO_ADDRESS ?? '0x0000000000000000000000000000000000000000') as Address
const CHAIN_ID    = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532', 10)
const RPC_URL     = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org'

// ─── Badge computation ────────────────────────────────────────────────────────

type PsychicBadge = 'INITIATE' | 'SEER' | 'ORACLE' | 'PROPHET' | 'VOID_SEER'

function computeBadge(score: number): PsychicBadge {
  if (score >= 1750) return 'VOID_SEER'
  if (score >= 1500) return 'PROPHET'
  if (score >= 1250) return 'ORACLE'
  if (score >= 1000) return 'SEER'
  return 'INITIATE'
}

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// ─── On-chain profile fetcher ─────────────────────────────────────────────────

async function fetchProfiles(addresses: Address[]): Promise<Map<Address, {
  score: number
  contraryWins: number
  totalBets: number
  accuracy: number
}>> {
  const chain = CHAIN_ID === 8453 ? base : baseSepolia
  const client = createPublicClient({ chain, transport: http(RPC_URL) })

  const results = new Map<Address, { score: number; contraryWins: number; totalBets: number; accuracy: number }>()

  // Batch with multicall-style parallel reads
  const calls = addresses.map(addr =>
    client.readContract({
      address: PCO_ADDRESS,
      abi: PCO_ABI,
      functionName: 'getPsychicProfile',
      args: [addr],
    }).then(([score, contraryWins, totalBetsPlaced, accuracy]) => ({
      address: addr,
      score: Number(score),
      contraryWins: Number(contraryWins),
      totalBets: Number(totalBetsPlaced),
      accuracy: Number(accuracy),
    })).catch(() => null)
  )

  const settled = await Promise.all(calls)
  for (const result of settled) {
    if (result && result.score > 0) {
      results.set(result.address, result)
    }
  }
  return results
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit   = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)
    const userAddr = searchParams.get('user') as Address | null

    // ── Step 1: Get known bettor addresses from DB ──────────────────────────
    // Import lazily to avoid build-time issues
    const { prisma } = await import('@voidborne/database')

    // Get unique bettor addresses from users who have placed bets.
    // Bet model uses userId; User model has walletAddress.
    const usersWithBets = await prisma.user.findMany({
      where: {
        bets: { some: {} },
        walletAddress: { not: undefined },
      },
      select: { walletAddress: true },
      take: 200,
    })

    const knownAddresses = usersWithBets
      .map(u => u.walletAddress)
      .filter((addr): addr is string => !!addr)
      .map(addr => addr.toLowerCase() as Address)

    // Add current user if not already included
    if (userAddr && !knownAddresses.includes(userAddr.toLowerCase() as Address)) {
      knownAddresses.push(userAddr.toLowerCase() as Address)
    }

    // ── Step 2: Fetch on-chain profiles ────────────────────────────────────
    let profiles: Map<Address, { score: number; contraryWins: number; totalBets: number; accuracy: number }>

    // If PCO contract not deployed yet (zero address), return mock data for dev
    if (PCO_ADDRESS === '0x0000000000000000000000000000000000000000') {
      profiles = generateMockLeaderboard(knownAddresses.slice(0, limit))
    } else {
      profiles = await fetchProfiles(knownAddresses)
    }

    // ── Step 3: Build & sort entries ───────────────────────────────────────
    const allEntries = Array.from(profiles.entries())
      .filter(([, p]) => p.totalBets > 0)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([addr, p], i) => ({
        rank: i + 1,
        address: addr,
        displayName: truncateAddr(addr),
        score: p.score,
        contraryWins: p.contraryWins,
        totalBets: p.totalBets,
        accuracy: p.accuracy,
        badge: computeBadge(p.score),
      }))

    // ── Step 4: Find current user's entry (may be outside top N) ───────────
    let myEntry = null
    if (userAddr) {
      const lc = userAddr.toLowerCase() as Address
      const profile = profiles.get(lc)
      const existingRank = allEntries.findIndex(e => e.address === lc)

      if (existingRank >= 0) {
        // Already in top N — no separate entry needed
      } else if (profile && profile.totalBets > 0) {
        // Calculate true rank by counting all profiles with higher score
        const allScores = Array.from(profiles.values()).map(p => p.score)
        const trueRank = allScores.filter(s => s > profile.score).length + 1
        myEntry = {
          rank: trueRank,
          address: lc,
          displayName: truncateAddr(userAddr),
          score: profile.score,
          contraryWins: profile.contraryWins,
          totalBets: profile.totalBets,
          accuracy: profile.accuracy,
          badge: computeBadge(profile.score),
        }
      }
    }

    return NextResponse.json(
      { entries: allEntries, myEntry, total: profiles.size },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (err) {
    console.error('[/api/psychic/leaderboard]', err)
    return NextResponse.json(
      { error: 'Failed to load leaderboard', entries: [], myEntry: null },
      { status: 500 }
    )
  }
}

// ─── Mock data (used when PCO contract not yet deployed) ──────────────────────

function generateMockLeaderboard(addresses: Address[]): Map<Address, {
  score: number; contraryWins: number; totalBets: number; accuracy: number
}> {
  const map = new Map<Address, { score: number; contraryWins: number; totalBets: number; accuracy: number }>()

  // Fixed mock entries for demo
  const mocks: [Address, { score: number; contraryWins: number; totalBets: number; accuracy: number }][] = [
    ['0xdeadbeef00000000000000000000000000000001', { score: 1820, contraryWins: 12, totalBets: 34, accuracy: 76 }],
    ['0xdeadbeef00000000000000000000000000000002', { score: 1640, contraryWins: 8,  totalBets: 28, accuracy: 71 }],
    ['0xdeadbeef00000000000000000000000000000003', { score: 1510, contraryWins: 6,  totalBets: 22, accuracy: 68 }],
    ['0xdeadbeef00000000000000000000000000000004', { score: 1380, contraryWins: 5,  totalBets: 19, accuracy: 63 }],
    ['0xdeadbeef00000000000000000000000000000005', { score: 1290, contraryWins: 3,  totalBets: 16, accuracy: 62 }],
  ]

  for (const [addr, profile] of mocks) {
    map.set(addr, profile)
  }

  // Add any real known addresses with starter scores
  for (const addr of addresses.slice(0, 5)) {
    if (!map.has(addr)) {
      map.set(addr, {
        score: 1000 + Math.floor(Math.random() * 200),
        contraryWins: Math.floor(Math.random() * 3),
        totalBets: Math.floor(Math.random() * 5) + 1,
        accuracy: 40 + Math.floor(Math.random() * 30),
      })
    }
  }

  return map
}
