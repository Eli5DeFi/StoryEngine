/**
 * Skills API
 * GET /api/progression/skills - Get all skill trees
 * GET /api/progression/skills?userId=[id] - Get user's skill trees
 * POST /api/progression/skills/unlock - Unlock a skill
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import progressionService from '@/../../packages/database/src/services/progression.service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get user's skill trees
      const trees = await progressionService.getUserSkillTrees(userId);
      return NextResponse.json(trees);
    }

    // Get all skill trees
    const trees = await prisma.skillTree.findMany({
      include: {
        skills: {
          orderBy: [{ tier: 'asc' }, { requiredLevel: 'asc' }],
        },
      },
    });

    return NextResponse.json(trees);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, skillId } = body;

    if (!userId || !skillId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, skillId' },
        { status: 400 }
      );
    }

    const result = await progressionService.unlockSkill(userId, skillId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error unlocking skill:', error);
    return NextResponse.json(
      { error: 'Failed to unlock skill' },
      { status: 500 }
    );
  }
}
