/**
 * User Progression API
 * GET /api/progression/[userId] - Get user's progression status
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get user progress
    const progress = await prisma.userProgress.findUnique({
      where: { userId },
      include: {
        skills: {
          include: {
            skill: {
              include: {
                tree: true,
              },
            },
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: [
            { isCompleted: 'desc' },
            { achievement: { sortOrder: 'asc' } },
          ],
        },
        quests: {
          where: {
            expiresAt: {
              gte: new Date(),
            },
          },
          include: {
            quest: true,
          },
          orderBy: [
            { isCompleted: 'asc' },
            { quest: { type: 'asc' } },
          ],
        },
      },
    });

    if (!progress) {
      // Create default progress for new user
      const newProgress = await prisma.userProgress.create({
        data: {
          userId,
          level: 1,
          currentXP: 0,
          totalXP: 0,
          xpToNextLevel: 100,
        },
        include: {
          skills: {
            include: {
              skill: {
                include: {
                  tree: true,
                },
              },
            },
          },
          achievements: {
            include: {
              achievement: true,
            },
          },
          quests: {
            include: {
              quest: true,
            },
          },
        },
      });

      return NextResponse.json(newProgress);
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching progression:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progression' },
      { status: 500 }
    );
  }
}
