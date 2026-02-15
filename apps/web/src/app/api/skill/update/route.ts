/**
 * Update Player Skill API - Update rating after bet result
 * POST /api/skill/update
 * Body: { walletAddress, poolId, won }
 */

import { NextRequest, NextResponse } from 'next/server';
import { skillRatingSystem, SkillTier } from '@/lib/dynamic-difficulty/skillRating';

// Use existing Prisma client from database package
const prisma = global.prisma || new (require('@voidborne/database').PrismaClient)();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, poolId, won } = body;

    if (!walletAddress || !poolId || typeof won !== 'boolean') {
      return NextResponse.json(
        { error: 'walletAddress, poolId, and won are required' },
        { status: 400 }
      );
    }

    // Get user and skill
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { playerSkill: true }
    });

    if (!user || !user.playerSkill) {
      return NextResponse.json(
        { error: 'User or skill not found' },
        { status: 404 }
      );
    }

    // Get pool and calculate opponent average rating
    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        bets: {
          include: {
            user: {
              include: { playerSkill: true }
            }
          }
        }
      }
    });

    if (!pool) {
      return NextResponse.json(
        { error: 'Betting pool not found' },
        { status: 404 }
      );
    }

    // Calculate opponent average ELO (all other bettors)
    const otherBettors = pool.bets
      .filter((bet: any) => bet.userId !== user.id)
      .map((bet: any) => bet.user.playerSkill)
      .filter(Boolean);

    const opponentAvgRating = otherBettors.length > 0
      ? otherBettors.reduce((sum: number, skill: any) => sum + (skill?.eloRating || 1000), 0) / otherBettors.length
      : 1000;

    // Update rating
    const currentSkill = {
      userId: user.id,
      eloRating: user.playerSkill.eloRating,
      totalBets: user.playerSkill.totalBets,
      wins: user.playerSkill.wins,
      losses: user.playerSkill.losses,
      winRate: user.playerSkill.winRate,
      currentStreak: user.playerSkill.currentStreak,
      longestWinStreak: user.playerSkill.longestWinStreak,
      tier: user.playerSkill.tier as SkillTier,
      lastBetDate: user.playerSkill.lastBetDate,
      averageBetSize: Number(user.playerSkill.averageBetSize),
      totalWagered: Number(user.playerSkill.totalWagered),
      totalEarnings: Number(user.playerSkill.totalEarnings)
    };

    const updatedSkill = skillRatingSystem.updateRating(
      currentSkill,
      opponentAvgRating,
      won
    );

    // Check for tier change
    const oldTier = user.playerSkill.tier;
    const newTier = updatedSkill.tier;
    const tierChanged = oldTier !== newTier;

    // Update tier history if changed
    let tierHistory = user.playerSkill.tierHistory as any[];
    if (tierChanged) {
      tierHistory.push({
        tier: newTier,
        achievedAt: new Date().toISOString(),
        eloRating: updatedSkill.eloRating
      });
    }

    // Save to database
    await prisma.playerSkill.update({
      where: { userId: user.id },
      data: {
        eloRating: updatedSkill.eloRating,
        totalBets: updatedSkill.totalBets,
        wins: updatedSkill.wins,
        losses: updatedSkill.losses,
        winRate: updatedSkill.winRate,
        currentStreak: updatedSkill.currentStreak,
        longestWinStreak: updatedSkill.longestWinStreak,
        tier: updatedSkill.tier,
        lastBetDate: updatedSkill.lastBetDate,
        tierHistory
      }
    });

    return NextResponse.json({
      skill: updatedSkill,
      tierChanged,
      oldTier: tierChanged ? oldTier : undefined,
      newTier: tierChanged ? newTier : undefined
    });
  } catch (error) {
    console.error('Error updating player skill:', error);
    return NextResponse.json(
      { error: 'Failed to update player skill' },
      { status: 500 }
    );
  }
}
