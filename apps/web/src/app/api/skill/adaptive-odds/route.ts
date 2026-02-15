/**
 * Adaptive Odds API - Calculate personalized odds for a player
 * GET /api/skill/adaptive-odds?walletAddress=0x...&standardOdds=2.5
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
    const standardOddsParam = searchParams.get('standardOdds');

    if (!walletAddress || !standardOddsParam) {
      return NextResponse.json(
        { error: 'walletAddress and standardOdds are required' },
        { status: 400 }
      );
    }

    const standardOdds = parseFloat(standardOddsParam);

    if (isNaN(standardOdds) || standardOdds <= 0) {
      return NextResponse.json(
        { error: 'standardOdds must be a positive number' },
        { status: 400 }
      );
    }

    // Get user's skill tier
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

    const tier = user.playerSkill.tier as SkillTier;

    // Calculate adaptive odds
    const adaptiveOdds = skillRatingSystem.calculateAdaptiveOdds(
      standardOdds,
      tier
    );

    return NextResponse.json({
      walletAddress,
      tier,
      standardOdds,
      adaptiveOdds: adaptiveOdds.adjustedOdds,
      oddsMultiplier: adaptiveOdds.oddsMultiplier,
      boost: adaptiveOdds.oddsMultiplier > 1 
        ? `+${((adaptiveOdds.oddsMultiplier - 1) * 100).toFixed(0)}%`
        : `-${((1 - adaptiveOdds.oddsMultiplier) * 100).toFixed(0)}%`
    });
  } catch (error) {
    console.error('Error calculating adaptive odds:', error);
    return NextResponse.json(
      { error: 'Failed to calculate adaptive odds' },
      { status: 500 }
    );
  }
}
