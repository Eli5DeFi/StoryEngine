/**
 * Award XP API
 * POST /api/progression/award-xp
 * Body: { userId: string, amount: number, source: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import progressionService from '@/../../packages/database/src/services/progression.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, source } = body;

    if (!userId || !amount || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, source' },
        { status: 400 }
      );
    }

    const result = await progressionService.awardXP(userId, amount, source);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json(
      { error: 'Failed to award XP' },
      { status: 500 }
    );
  }
}
