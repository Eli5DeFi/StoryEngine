/**
 * Achievements API
 * GET /api/progression/achievements?userId=[id] - Get user's achievements
 */

import { NextRequest, NextResponse } from 'next/server';
import progressionService from '@/../../packages/database/src/services/progression.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const achievements = await progressionService.getUserAchievements(userId);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
