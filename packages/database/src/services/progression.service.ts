/**
 * Prestige Progression System (PPS) Service
 * 
 * Handles:
 * - XP calculation and level-ups
 * - Skill tree unlocking
 * - Achievement tracking
 * - Quest management
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// XP & LEVELING SYSTEM
// ============================================================================

/**
 * XP sources and amounts
 */
export const XP_SOURCES = {
  READ_CHAPTER: 10,
  PLACE_BET: 50,
  WIN_BET: 200,
  DISCOVER_LORE: 500,
  SUBMIT_FAN_FIC: 1000,
  MINT_ARTIFACT: 300,
  VOTE_IN_ORACLE: 100,
  DAILY_LOGIN: 25,
  COMPLETE_QUEST: 0, // Variable based on quest difficulty
} as const;

/**
 * Quest XP rewards by difficulty
 */
export const QUEST_XP_REWARDS = {
  EASY: 50,
  MEDIUM: 150,
  HARD: 400,
  EPIC: 1000,
} as const;

/**
 * Calculate XP required for a given level
 * Formula: 100 * level^1.5 (exponential growth)
 */
export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate total XP required to reach a level
 */
export function calculateTotalXPForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += calculateXPForLevel(l);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
} {
  let level = 1;
  let xpAccumulated = 0;

  while (level < 100) {
    const xpForNextLevel = calculateXPForLevel(level + 1);
    if (xpAccumulated + xpForNextLevel > totalXP) {
      break;
    }
    xpAccumulated += xpForNextLevel;
    level++;
  }

  const currentXP = totalXP - xpAccumulated;
  const xpToNextLevel = level < 100 ? calculateXPForLevel(level + 1) : 0;

  return { level, currentXP, xpToNextLevel };
}

/**
 * Award XP to a user and handle level-ups
 */
export async function awardXP(
  userId: string,
  amount: number,
  source: keyof typeof XP_SOURCES
): Promise<{
  newLevel: number;
  levelsGained: number;
  totalXP: number;
  skillPointsGained: number;
}> {
  // Get or create user progress
  let progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        xpToNextLevel: calculateXPForLevel(2),
      },
    });
  }

  const oldLevel = progress.level;
  const newTotalXP = progress.totalXP + amount;

  // Calculate new level
  const { level: newLevel, currentXP, xpToNextLevel } = calculateLevelFromXP(newTotalXP);
  const levelsGained = newLevel - oldLevel;

  // Award 1 skill point per level gained
  const skillPointsGained = levelsGained;

  // Update progress
  const updated = await prisma.userProgress.update({
    where: { userId },
    data: {
      totalXP: newTotalXP,
      currentXP,
      level: newLevel,
      xpToNextLevel,
      skillPointsAvailable: progress.skillPointsAvailable + skillPointsGained,
      lastXPGain: new Date(),
      ...(levelsGained > 0 && { lastLevelUp: new Date() }),
    },
  });

  // Check for level-based achievements
  if (levelsGained > 0) {
    await checkAchievements(userId, 'REACH_LEVEL', newLevel);
  }

  // Check for activity-based achievements
  await incrementActivityCounter(userId, source);

  return {
    newLevel,
    levelsGained,
    totalXP: newTotalXP,
    skillPointsGained,
  };
}

/**
 * Increment activity counters (chapters read, bets placed, etc.)
 */
async function incrementActivityCounter(
  userId: string,
  source: keyof typeof XP_SOURCES
): Promise<void> {
  const fieldMap: Record<string, string> = {
    READ_CHAPTER: 'chaptersRead',
    PLACE_BET: 'betsPlaced',
    WIN_BET: 'betsWon',
    DISCOVER_LORE: 'loreDiscovered',
    SUBMIT_FAN_FIC: 'fanFicsSubmitted',
  };

  const field = fieldMap[source];
  if (!field) return;

  await prisma.userProgress.update({
    where: { userId },
    data: {
      [field]: { increment: 1 },
    },
  });

  // Check relevant achievements
  const achievementMap: Record<string, any> = {
    chaptersRead: 'CHAPTERS_READ',
    betsPlaced: 'BETS_PLACED',
    betsWon: 'BETS_WON',
    loreDiscovered: 'LORE_DISCOVERED',
    fanFicsSubmitted: 'FAN_FICS_SUBMITTED',
  };

  const achievementType = achievementMap[field];
  if (achievementType) {
    const progress = await prisma.userProgress.findUnique({
      where: { userId },
    });
    if (progress) {
      await checkAchievements(userId, achievementType, (progress as any)[field] + 1);
    }
  }
}

// ============================================================================
// SKILL TREE SYSTEM
// ============================================================================

/**
 * Unlock a skill for a user
 */
export async function unlockSkill(
  userId: string,
  skillId: string
): Promise<{
  success: boolean;
  error?: string;
  skill?: any;
}> {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    include: {
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!progress) {
    return { success: false, error: 'User progress not found' };
  }

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { tree: true },
  });

  if (!skill) {
    return { success: false, error: 'Skill not found' };
  }

  // Check if already unlocked
  const existing = progress.skills.find((s) => s.skillId === skillId);
  if (existing) {
    return { success: false, error: 'Skill already unlocked' };
  }

  // Check level requirement
  if (progress.level < skill.requiredLevel) {
    return {
      success: false,
      error: `Requires level ${skill.requiredLevel} (current: ${progress.level})`,
    };
  }

  // Check skill point requirement
  if (progress.skillPointsAvailable < skill.skillPointCost) {
    return {
      success: false,
      error: `Requires ${skill.skillPointCost} skill points (available: ${progress.skillPointsAvailable})`,
    };
  }

  // Check prerequisite skills
  if (skill.requiredSkills.length > 0) {
    const unlockedSkillIds = progress.skills.map((s) => s.skillId);
    const missingPrereqs = skill.requiredSkills.filter(
      (reqId) => !unlockedSkillIds.includes(reqId)
    );

    if (missingPrereqs.length > 0) {
      return {
        success: false,
        error: 'Missing prerequisite skills',
      };
    }
  }

  // Unlock the skill
  const userSkill = await prisma.userSkill.create({
    data: {
      userId,
      skillId,
      level: 1,
      maxLevel: 1,
    },
    include: {
      skill: {
        include: { tree: true },
      },
    },
  });

  // Deduct skill points
  await prisma.userProgress.update({
    where: { userId },
    data: {
      skillPointsAvailable: progress.skillPointsAvailable - skill.skillPointCost,
      skillPointsSpent: progress.skillPointsSpent + skill.skillPointCost,
    },
  });

  return { success: true, skill: userSkill };
}

/**
 * Get user's skill tree progress
 */
export async function getUserSkillTrees(userId: string) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    include: {
      skills: {
        include: {
          skill: {
            include: { tree: true },
          },
        },
      },
    },
  });

  if (!progress) {
    return {
      skillPointsAvailable: 0,
      skillPointsSpent: 0,
      trees: [],
    };
  }

  // Get all skill trees with their skills
  const trees = await prisma.skillTree.findMany({
    include: {
      skills: {
        orderBy: [{ tier: 'asc' }, { requiredLevel: 'asc' }],
      },
    },
  });

  // Map unlocked skills for easy lookup
  const unlockedSkillIds = new Set(progress.skills.map((s) => s.skillId));

  // Format tree data
  const formattedTrees = trees.map((tree) => ({
    ...tree,
    skills: tree.skills.map((skill) => ({
      ...skill,
      isUnlocked: unlockedSkillIds.has(skill.id),
      isAvailable:
        progress.level >= skill.requiredLevel &&
        progress.skillPointsAvailable >= skill.skillPointCost,
    })),
  }));

  return {
    skillPointsAvailable: progress.skillPointsAvailable,
    skillPointsSpent: progress.skillPointsSpent,
    trees: formattedTrees,
  };
}

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

/**
 * Check and update achievements for a user
 */
export async function checkAchievements(
  userId: string,
  requirementType: string,
  currentValue: number
): Promise<void> {
  // Find relevant achievements
  const achievements = await prisma.achievement.findMany({
    where: {
      requirementType: requirementType as any,
    },
  });

  for (const achievement of achievements) {
    // Check if user already has this achievement
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!userAchievement) {
      // Create new achievement progress
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: currentValue,
          isCompleted: currentValue >= achievement.requirementValue,
          completedAt:
            currentValue >= achievement.requirementValue ? new Date() : null,
        },
      });

      // Award rewards if completed
      if (currentValue >= achievement.requirementValue) {
        await awardAchievementRewards(userId, achievement);
      }
    } else if (!userAchievement.isCompleted) {
      // Update progress
      const isCompleted = currentValue >= achievement.requirementValue;

      await prisma.userAchievement.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        data: {
          progress: currentValue,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      // Award rewards if just completed
      if (isCompleted && !userAchievement.rewardsClaimed) {
        await awardAchievementRewards(userId, achievement);
      }
    }
  }
}

/**
 * Award achievement rewards
 */
async function awardAchievementRewards(userId: string, achievement: any) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress) return;

  // Award XP
  if (achievement.xpReward > 0) {
    await awardXP(userId, achievement.xpReward, 'DAILY_LOGIN'); // Use generic source
  }

  // Award skill points
  if (achievement.skillPointReward > 0) {
    await prisma.userProgress.update({
      where: { userId },
      data: {
        skillPointsAvailable: progress.skillPointsAvailable + achievement.skillPointReward,
      },
    });
  }

  // Mark rewards as claimed
  await prisma.userAchievement.update({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
    data: {
      rewardsClaimed: true,
    },
  });
}

/**
 * Get user's achievement progress
 */
export async function getUserAchievements(userId: string) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: [
      { isCompleted: 'desc' },
      { achievement: { sortOrder: 'asc' } },
    ],
  });

  const allAchievements = await prisma.achievement.findMany({
    where: {
      isSecret: false,
    },
    orderBy: [{ sortOrder: 'asc' }],
  });

  // Merge user progress with all achievements
  const achievementMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua])
  );

  return allAchievements.map((achievement) => {
    const userProgress = achievementMap.get(achievement.id);
    return {
      ...achievement,
      progress: userProgress?.progress || 0,
      isCompleted: userProgress?.isCompleted || false,
      completedAt: userProgress?.completedAt || null,
      rewardsClaimed: userProgress?.rewardsClaimed || false,
    };
  });
}

// ============================================================================
// QUEST SYSTEM
// ============================================================================

/**
 * Assign daily/weekly quests to a user
 */
export async function assignQuests(userId: string, type: 'DAILY' | 'WEEKLY') {
  const now = new Date();
  const duration = type === 'DAILY' ? 24 : 168; // hours
  const expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);

  // Get active quests of this type
  const availableQuests = await prisma.quest.findMany({
    where: {
      type,
      isActive: true,
    },
  });

  // Randomly select quests (3 daily, 5 weekly)
  const count = type === 'DAILY' ? 3 : 5;
  const selectedQuests = availableQuests
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  // Assign quests to user
  for (const quest of selectedQuests) {
    // Check if user already has this quest active
    const existing = await prisma.userQuest.findFirst({
      where: {
        userId,
        questId: quest.id,
        isCompleted: false,
      },
    });

    if (!existing) {
      await prisma.userQuest.create({
        data: {
          userId,
          questId: quest.id,
          progress: 0,
          isCompleted: false,
          assignedAt: now,
          expiresAt,
        },
      });
    }
  }
}

/**
 * Update quest progress
 */
export async function updateQuestProgress(
  userId: string,
  requirementType: string,
  incrementBy: number = 1
) {
  const activeQuests = await prisma.userQuest.findMany({
    where: {
      userId,
      isCompleted: false,
      quest: {
        requirementType: requirementType as any,
      },
    },
    include: {
      quest: true,
    },
  });

  for (const userQuest of activeQuests) {
    const newProgress = userQuest.progress + incrementBy;
    const isCompleted = newProgress >= userQuest.quest.requirementValue;

    await prisma.userQuest.update({
      where: { id: userQuest.id },
      data: {
        progress: newProgress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Award rewards if just completed
    if (isCompleted && !userQuest.rewardsClaimed) {
      await awardQuestRewards(userId, userQuest.quest);
    }
  }
}

/**
 * Award quest rewards
 */
async function awardQuestRewards(userId: string, quest: any) {
  // Award XP
  if (quest.xpReward > 0) {
    await awardXP(userId, quest.xpReward, 'COMPLETE_QUEST');
  }

  // Award skill points
  if (quest.skillPointReward > 0) {
    const progress = await prisma.userProgress.findUnique({
      where: { userId },
    });
    if (progress) {
      await prisma.userProgress.update({
        where: { userId },
        data: {
          skillPointsAvailable: progress.skillPointsAvailable + quest.skillPointReward,
        },
      });
    }
  }

  // Mark rewards as claimed
  await prisma.userQuest.updateMany({
    where: {
      userId,
      questId: quest.id,
      isCompleted: true,
      rewardsClaimed: false,
    },
    data: {
      rewardsClaimed: true,
    },
  });
}

/**
 * Get user's active quests
 */
export async function getUserQuests(userId: string) {
  const now = new Date();

  const quests = await prisma.userQuest.findMany({
    where: {
      userId,
      expiresAt: {
        gte: now,
      },
    },
    include: {
      quest: true,
    },
    orderBy: [
      { isCompleted: 'asc' },
      { quest: { type: 'asc' } },
      { expiresAt: 'asc' },
    ],
  });

  return quests.map((uq) => ({
    ...uq,
    timeRemaining: uq.expiresAt
      ? Math.max(0, uq.expiresAt.getTime() - now.getTime())
      : null,
  }));
}

// ============================================================================
// PRESTIGE SYSTEM
// ============================================================================

/**
 * Prestige: Reset to level 1, gain prestige level
 */
export async function prestige(userId: string) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    throw new Error('User progress not found');
  }

  if (progress.level < 100) {
    throw new Error('Must reach level 100 to prestige');
  }

  // Calculate prestige bonus (1 prestige point per 100 levels + bonus skill points)
  const prestigePointsGained = 1;
  const bonusSkillPoints = 10; // Bonus for prestiging

  await prisma.userProgress.update({
    where: { userId },
    data: {
      level: 1,
      currentXP: 0,
      totalXP: 0,
      xpToNextLevel: calculateXPForLevel(2),
      prestigeLevel: progress.prestigeLevel + 1,
      prestigePoints: progress.prestigePoints + prestigePointsGained,
      skillPointsAvailable: bonusSkillPoints, // Reset but give bonus
      skillPointsSpent: 0,
      lastPrestige: new Date(),
    },
  });

  // Check prestige achievements
  await checkAchievements(userId, 'REACH_PRESTIGE', progress.prestigeLevel + 1);

  return {
    prestigeLevel: progress.prestigeLevel + 1,
    bonusSkillPoints,
  };
}

export default {
  awardXP,
  unlockSkill,
  getUserSkillTrees,
  getUserAchievements,
  assignQuests,
  updateQuestProgress,
  getUserQuests,
  prestige,
  calculateXPForLevel,
  calculateLevelFromXP,
};
