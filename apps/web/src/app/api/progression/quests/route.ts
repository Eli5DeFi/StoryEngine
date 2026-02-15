/**
 * Quests API
 * GET /api/progression/quests?userId=[id] - Get user's quests
 * POST /api/progression/quests/assign - Assign quests to user
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

    const quests = await progressionService.getUserQuests(userId);

    return NextResponse.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type' },
        { status: 400 }
      );
    }

    if (type !== 'DAILY' && type !== 'WEEKLY') {
      return NextResponse.json(
        { error: 'Invalid quest type. Must be DAILY or WEEKLY' },
        { status: 400 }
      );
    }

    await progressionService.assignQuests(userId, type);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning quests:', error);
    return NextResponse.json(
      { error: 'Failed to assign quests' },
      { status: 500 }
    );
  }
}
