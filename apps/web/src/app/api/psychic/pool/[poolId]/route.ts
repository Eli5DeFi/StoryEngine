import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi, type Address } from 'viem'
import { baseSepolia, base } from 'viem/chains'

/**
 * GET /api/psychic/pool/[poolId]
 *
 * Read full Psychic Consensus Oracle state for a given pool ID.
 *
 * Returns:
 *   - Story pool (choices, odds, totalBets, status)
 *   - Consensus market (crowdRight %, contrarian %, psychicEdge)
 *   - Resolution state (if resolved: winningChoice, crowdWasRight)
 *
 * @param poolId - numeric poolId (BigInt compatible)
 * @query  user  - wallet address to fetch personal positions for
 */

export const dynamic = 'force-dynamic'

// ─── ABI ─────────────────────────────────────────────────────────────────────

const PCO_ABI = parseAbi([
  'function pools(uint256) view returns (uint256 chapterId, uint256 bettingDeadline, uint256 numChoices, uint256 totalBets, bool resolved, uint256 winningChoice, bool crowdWasRight, bool feesWithdrawn)',
  'function getOdds(uint256 poolId) view returns (uint256[] amounts, uint256[] pcts)',
  'function getConsensusState(uint256 poolId) view returns (uint256 crowdRightBets, uint256 crowdWrongBets, uint256 crowdRightPct, uint256 contraBonusMultiplier, bool resolved, bool crowdWasRight)',
  'function userBets(uint256 poolId, address user, uint256 choice) view returns (uint256)',
  'function userCrowdRight(uint256 poolId, address user) view returns (uint256)',
  'function userCrowdWrong(uint256 poolId, address user) view returns (uint256)',
  'function mainClaimed(uint256, address) view returns (bool)',
  'function psychicClaimed(uint256, address) view returns (bool)',
])

// ─── Config ───────────────────────────────────────────────────────────────────

const PCO_ADDRESS = (process.env.NEXT_PUBLIC_PCO_ADDRESS ?? '0x0000000000000000000000000000000000000000') as Address
const CHAIN_ID    = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532', 10)
const RPC_URL     = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org'

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const poolId = BigInt(params.poolId)
    const userAddr = request.nextUrl.searchParams.get('user') as Address | null

    // Return mock for dev if contract not deployed
    if (PCO_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(mockPoolState(poolId, userAddr))
    }

    const chain = CHAIN_ID === 8453 ? base : baseSepolia
    const client = createPublicClient({ chain, transport: http(RPC_URL) })

    // Parallel reads
    const [rawPool, oddsData, consensusData] = await Promise.all([
      client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'pools', args: [poolId] }),
      client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'getOdds', args: [poolId] }),
      client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'getConsensusState', args: [poolId] }),
    ])

    // User positions (only if address provided)
    let userPositions = null
    if (userAddr) {
      const numChoices = Number(rawPool[2])
      const userBetCalls = Array.from({ length: numChoices }, (_, i) =>
        client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'userBets', args: [poolId, userAddr, BigInt(i)] })
      )
      const [crowdRight, crowdWrong, mainClaimed, psychicClaimed, ...userBetsPerChoice] = await Promise.all([
        client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'userCrowdRight', args: [poolId, userAddr] }),
        client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'userCrowdWrong', args: [poolId, userAddr] }),
        client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'mainClaimed', args: [poolId, userAddr] }),
        client.readContract({ address: PCO_ADDRESS, abi: PCO_ABI, functionName: 'psychicClaimed', args: [poolId, userAddr] }),
        ...userBetCalls,
      ])

      userPositions = {
        betsPerChoice: userBetsPerChoice.map(b => b.toString()),
        crowdRightBet: crowdRight.toString(),
        crowdWrongBet: crowdWrong.toString(),
        mainClaimed,
        psychicClaimed,
      }
    }

    // Build response (all BigInts → string for JSON safety)
    const [amounts, pcts] = oddsData
    const [crBets, cwBets, crPct, contraMult, cResolved, crowdWasRight] = consensusData

    const totalBets = rawPool[3]
    const choices = amounts.map((amt, i) => ({
      index: i,
      totalBets: amt.toString(),
      oddsPercent: Number(pcts[i]),
      payoutMultiplier:
        totalBets > 0n && amt > 0n
          ? Math.round((Number(totalBets) / Number(amt)) * 100) / 100
          : 1,
      isMajority: pcts.indexOf(pcts.reduce((a, b) => (b > a ? b : a))) === i,
    }))

    const crowdRightPct = Number(crPct)
    const totalPsychic = crBets + cwBets
    const psychicEdge =
      totalPsychic > 0n && cwBets > 0n && crBets > 0n
        ? Math.round(
            ((2 * Number(cwBets) * crowdRightPct) / (Number(crBets) * (100 - crowdRightPct) || 1)) * 10
          ) / 10
        : 1

    return NextResponse.json({
      pool: {
        chapterId: rawPool[0].toString(),
        bettingDeadline: new Date(Number(rawPool[1]) * 1000).toISOString(),
        numChoices: Number(rawPool[2]),
        totalBets: rawPool[3].toString(),
        resolved: rawPool[4],
        winningChoice: rawPool[4] ? Number(rawPool[5]) : null,
        crowdWasRight: rawPool[4] ? rawPool[6] : null,
      },
      choices,
      consensus: {
        crowdRightBets: crBets.toString(),
        crowdWrongBets: cwBets.toString(),
        crowdRightPercent: crowdRightPct,
        contraBonusMultiplier: Number(contraMult),
        psychicEdge,
        resolved: cResolved,
        crowdWasRight: cResolved ? crowdWasRight : null,
      },
      userPositions,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error(`[/api/psychic/pool/${params.poolId}]`, err)
    return NextResponse.json({ error: 'Failed to fetch pool state' }, { status: 500 })
  }
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function mockPoolState(poolId: bigint, userAddr: Address | null) {
  const deadline = new Date(Date.now() + 6 * 3_600_000).toISOString()
  return {
    pool: {
      chapterId: '1',
      bettingDeadline: deadline,
      numChoices: 3,
      totalBets: '50000000000', // 50,000 USDC
      resolved: false,
      winningChoice: null,
      crowdWasRight: null,
    },
    choices: [
      { index: 0, totalBets: '28000000000', oddsPercent: 56, payoutMultiplier: 1.79, isMajority: true },
      { index: 1, totalBets: '16000000000', oddsPercent: 32, payoutMultiplier: 3.13, isMajority: false },
      { index: 2, totalBets: '6000000000',  oddsPercent: 12, payoutMultiplier: 8.33, isMajority: false },
    ],
    consensus: {
      crowdRightBets: '8000000000',
      crowdWrongBets: '2000000000',
      crowdRightPercent: 80,
      contraBonusMultiplier: 2,
      psychicEdge: 2.5,
      resolved: false,
      crowdWasRight: null,
    },
    userPositions: userAddr
      ? { betsPerChoice: ['0', '0', '0'], crowdRightBet: '0', crowdWrongBet: '0', mainClaimed: false, psychicClaimed: false }
      : null,
  }
}
