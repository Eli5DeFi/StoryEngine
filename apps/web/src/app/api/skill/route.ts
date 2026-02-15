/**
 * Player Skill API - Get player's skill rating and tier
 * GET /api/skill?walletAddress=0x...
 */

import { NextRequest, NextResponse } from 'next/server';
import { skillRatingSystem, SkillTier } from '@/lib/dynamic-difficulty/skillRating';

// Use existing Prisma client from database package
const prisma = global.prisma || new (require('@voidborne/database').PrismaClient)();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress query parameter is required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { playerSkill: true }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress,
          playerSkill: {
            create: {
              eloRating: 1000,
              tier: SkillTier.NOVICE
            }
          }
        },
        include: { playerSkill: true }
      });
    } else if (!user.playerSkill) {
      // User exists but no skill profile
      await prisma.playerSkill.create({
        data: {
          userId: user.id,
          eloRating: 1000,
          tier: SkillTier.NOVICE
        }
      });

      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { playerSkill: true }
      });
    }

    const skill = user!.playerSkill!;

    // Get tier info and progress
    const tierInfo = skillRatingSystem.getTierInfo(skill.tier as SkillTier);
    const progress = skillRatingSystem.getTierProgress({
      userId: user!.id,
      eloRating: skill.eloRating,
      totalBets: skill.totalBets,
      wins: skill.wins,
      losses: skill.losses,
      winRate: skill.winRate,
      currentStreak: skill.currentStreak,
      longestWinStreak: skill.longestWinStreak,
      tier: skill.tier as SkillTier,
      lastBetDate: skill.lastBetDate,
      averageBetSize: Number(skill.averageBetSize),
      totalWagered: Number(skill.totalWagered),
      totalEarnings: Number(skill.totalEarnings)
    });

    return NextResponse.json({
      skill: {
        userId: user!.id,
        eloRating: skill.eloRating,
        tier: skill.tier,
        totalBets: skill.totalBets,
        wins: skill.wins,
        losses: skill.losses,
        winRate: skill.winRate,
        currentStreak: skill.currentStreak,
        longestWinStreak: skill.longestWinStreak,
        averageBetSize: Number(skill.averageBetSize),
        totalWagered: Number(skill.totalWagered),
        totalEarnings: Number(skill.totalEarnings),
        netProfit: Number(skill.netProfit),
        lastBetDate: skill.lastBetDate.toISOString()
      },
      tierInfo,
      progress
    });
  } catch (error) {
    console.error('Error fetching player skill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player skill' },
      { status: 500 }
    );
  }
}
