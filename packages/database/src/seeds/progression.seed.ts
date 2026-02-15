/**
 * Seed data for Prestige Progression System (PPS)
 * 
 * Populates:
 * - Skill Trees (3 trees)
 * - Skills (15 skills across 3 trees)
 * - Achievements (20 achievements)
 * - Quests (15 quests: 10 daily, 5 weekly)
 */

import { PrismaClient, SkillCategory, AchievementCategory, AchievementRarity, AchievementRequirement, QuestType, QuestDifficulty, QuestRequirement } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// SKILL TREES & SKILLS
// ============================================================================

const SKILL_TREES = [
  {
    name: 'Bettor Tree',
    description: 'Master the art of prediction. Unlock powerful betting bonuses and insights.',
    icon: '🎲',
    category: 'BETTOR' as SkillCategory,
    minLevel: 1,
  },
  {
    name: 'Lore Hunter Tree',
    description: 'Uncover the secrets of the Voidborne universe. Discover hidden narratives and earn lore bounties.',
    icon: '🔍',
    category: 'LORE_HUNTER' as SkillCategory,
    minLevel: 10,
  },
  {
    name: 'Creator Tree',
    description: 'Shape the narrative. Write stories, influence the canon, and build your legacy.',
    icon: '✍️',
    category: 'CREATOR' as SkillCategory,
    minLevel: 20,
  },
];

const SKILLS = [
  // BETTOR TREE
  {
    treeName: 'Bettor Tree',
    name: 'Risk Taker',
    description: 'Earn +5% payout bonus on long-shot bets (odds < 30%)',
    icon: '💥',
    tier: 1,
    requiredLevel: 5,
    requiredSkills: [],
    skillPointCost: 1,
    benefits: {
      payoutBonus: 0.05,
      oddsThreshold: 0.30,
      description: '+5% payout on long-shot bets',
    },
  },
  {
    treeName: 'Bettor Tree',
    name: 'Oracle',
    description: 'See betting trends and odds history 1 hour before public',
    icon: '👁️',
    tier: 2,
    requiredLevel: 15,
    requiredSkills: ['Risk Taker'],
    skillPointCost: 2,
    benefits: {
      earlyAccess: 3600, // seconds
      description: 'See trends 1 hour early',
    },
  },
  {
    treeName: 'Bettor Tree',
    name: 'Whale',
    description: 'Increase max bet limit by 50%',
    icon: '🐋',
    tier: 3,
    requiredLevel: 30,
    requiredSkills: ['Oracle'],
    skillPointCost: 3,
    benefits: {
      maxBetMultiplier: 1.5,
      description: '+50% max bet limit',
    },
  },
  {
    treeName: 'Bettor Tree',
    name: 'Hedger',
    description: 'Place bets on multiple choices in the same pool with reduced fees (-25%)',
    icon: '⚖️',
    tier: 2,
    requiredLevel: 20,
    requiredSkills: ['Risk Taker'],
    skillPointCost: 2,
    benefits: {
      feeReduction: 0.25,
      allowMultipleBets: true,
      description: 'Hedge bets with -25% fees',
    },
  },
  {
    treeName: 'Bettor Tree',
    name: 'Iron Hands',
    description: 'Lock in bets early for +10% payout bonus',
    icon: '💎',
    tier: 3,
    requiredLevel: 40,
    requiredSkills: ['Whale', 'Hedger'],
    skillPointCost: 4,
    benefits: {
      earlyBetBonus: 0.10,
      earlyThreshold: 0.75, // First 75% of betting window
      description: '+10% payout for early bets',
    },
  },

  // LORE HUNTER TREE
  {
    treeName: 'Lore Hunter Tree',
    name: 'Detective',
    description: 'Earn +10% bounty rewards for discovering lore fragments',
    icon: '🕵️',
    tier: 1,
    requiredLevel: 10,
    requiredSkills: [],
    skillPointCost: 1,
    benefits: {
      loreBountyBonus: 0.10,
      description: '+10% lore bounty rewards',
    },
  },
  {
    treeName: 'Lore Hunter Tree',
    name: 'Archivist',
    description: 'Access alternate outcomes and "what-if" chapters for free',
    icon: '📚',
    tier: 2,
    requiredLevel: 25,
    requiredSkills: ['Detective'],
    skillPointCost: 2,
    benefits: {
      freeAlternateOutcomes: true,
      description: 'Free access to alternate outcomes',
    },
  },
  {
    treeName: 'Lore Hunter Tree',
    name: 'Prophet',
    description: 'Submit story theories for +500 XP if proven correct',
    icon: '🔮',
    tier: 3,
    requiredLevel: 40,
    requiredSkills: ['Archivist'],
    skillPointCost: 3,
    benefits: {
      theoryBonusXP: 500,
      description: '+500 XP for correct theories',
    },
  },
  {
    treeName: 'Lore Hunter Tree',
    name: 'Memory Keeper',
    description: 'Track character relationships and unlock hidden character insights',
    icon: '🧠',
    tier: 2,
    requiredLevel: 30,
    requiredSkills: ['Detective'],
    skillPointCost: 2,
    benefits: {
      characterInsights: true,
      relationshipTracking: true,
      description: 'Unlock character insights',
    },
  },
  {
    treeName: 'Lore Hunter Tree',
    name: 'Timeline Master',
    description: 'View complete story timeline with branching paths',
    icon: '⏳',
    tier: 4,
    requiredLevel: 50,
    requiredSkills: ['Prophet', 'Memory Keeper'],
    skillPointCost: 5,
    benefits: {
      fullTimeline: true,
      branchingPaths: true,
      description: 'Complete timeline visualization',
    },
  },

  // CREATOR TREE
  {
    treeName: 'Creator Tree',
    name: 'Wordsmith',
    description: 'Fan fiction submissions get review priority (48h → 24h)',
    icon: '🖋️',
    tier: 1,
    requiredLevel: 20,
    requiredSkills: [],
    skillPointCost: 1,
    benefits: {
      reviewPriority: true,
      reviewTimeReduction: 0.5,
      description: 'Priority fan fic review',
    },
  },
  {
    treeName: 'Creator Tree',
    name: 'Canon Weaver',
    description: 'Your vote counts 2x in fan fiction canonization polls',
    icon: '🪡',
    tier: 2,
    requiredLevel: 35,
    requiredSkills: ['Wordsmith'],
    skillPointCost: 2,
    benefits: {
      voteMultiplier: 2.0,
      description: '2x voting power',
    },
  },
  {
    treeName: 'Creator Tree',
    name: 'Story Architect',
    description: 'Request specific character arcs or plot directions',
    icon: '🏛️',
    tier: 3,
    requiredLevel: 50,
    requiredSkills: ['Canon Weaver'],
    skillPointCost: 4,
    benefits: {
      arcRequests: true,
      monthlyRequests: 2,
      description: 'Request plot directions',
    },
  },
  {
    treeName: 'Creator Tree',
    name: 'Voice Director',
    description: 'Audition for voice acting roles with reduced submission fee (-50%)',
    icon: '🎙️',
    tier: 2,
    requiredLevel: 30,
    requiredSkills: ['Wordsmith'],
    skillPointCost: 2,
    benefits: {
      voiceSubmissionDiscount: 0.50,
      description: '-50% voice audition fees',
    },
  },
  {
    treeName: 'Creator Tree',
    name: 'Artifact Forger',
    description: 'Mint Narrative Artifacts with -20% fees',
    icon: '⚒️',
    tier: 3,
    requiredLevel: 45,
    requiredSkills: ['Story Architect', 'Voice Director'],
    skillPointCost: 5,
    benefits: {
      artifactMintDiscount: 0.20,
      description: '-20% artifact minting fees',
    },
  },
];

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

const ACHIEVEMENTS = [
  // BETTING ACHIEVEMENTS
  {
    name: 'First Blood',
    description: 'Place your first bet',
    icon: '🎯',
    category: 'BETTING' as AchievementCategory,
    rarity: 'COMMON' as AchievementRarity,
    requirementType: 'BETS_PLACED' as AchievementRequirement,
    requirementValue: 1,
    xpReward: 100,
    skillPointReward: 0,
    isSecret: false,
    sortOrder: 1,
  },
  {
    name: 'Veteran Bettor',
    description: 'Place 100 bets',
    icon: '🎲',
    category: 'BETTING' as AchievementCategory,
    rarity: 'RARE' as AchievementRarity,
    requirementType: 'BETS_PLACED' as AchievementRequirement,
    requirementValue: 100,
    xpReward: 500,
    skillPointReward: 1,
    isSecret: false,
    sortOrder: 2,
  },
  {
    name: 'Master Predictor',
    description: 'Win 50 bets',
    icon: '🏆',
    category: 'BETTING' as AchievementCategory,
    rarity: 'EPIC' as AchievementRarity,
    requirementType: 'BETS_WON' as AchievementRequirement,
    requirementValue: 50,
    xpReward: 1000,
    skillPointReward: 2,
    isSecret: false,
    sortOrder: 3,
  },
  {
    name: 'Oracle of Voidborne',
    description: 'Win 10 bets in a row',
    icon: '👁️',
    category: 'BETTING' as AchievementCategory,
    rarity: 'LEGENDARY' as AchievementRarity,
    requirementType: 'WIN_STREAK' as AchievementRequirement,
    requirementValue: 10,
    xpReward: 2500,
    skillPointReward: 5,
    title: 'Oracle',
    isSecret: false,
    sortOrder: 4,
  },

  // READING ACHIEVEMENTS
  {
    name: 'Bookworm',
    description: 'Read 10 chapters',
    icon: '📖',
    category: 'READING' as AchievementCategory,
    rarity: 'COMMON' as AchievementRarity,
    requirementType: 'CHAPTERS_READ' as AchievementRequirement,
    requirementValue: 10,
    xpReward: 200,
    skillPointReward: 0,
    isSecret: false,
    sortOrder: 10,
  },
  {
    name: 'Lore Scholar',
    description: 'Read 50 chapters',
    icon: '🎓',
    category: 'READING' as AchievementCategory,
    rarity: 'RARE' as AchievementRarity,
    requirementType: 'CHAPTERS_READ' as AchievementRequirement,
    requirementValue: 50,
    xpReward: 750,
    skillPointReward: 1,
    isSecret: false,
    sortOrder: 11,
  },
  {
    name: 'Chronicler',
    description: 'Read 100 chapters',
    icon: '📚',
    category: 'READING' as AchievementCategory,
    rarity: 'EPIC' as AchievementRarity,
    requirementType: 'CHAPTERS_READ' as AchievementRequirement,
    requirementValue: 100,
    xpReward: 1500,
    skillPointReward: 3,
    title: 'Chronicler',
    isSecret: false,
    sortOrder: 12,
  },

  // LORE ACHIEVEMENTS
  {
    name: 'Lore Hunter',
    description: 'Discover 5 lore fragments',
    icon: '🔍',
    category: 'LORE' as AchievementCategory,
    rarity: 'UNCOMMON' as AchievementRarity,
    requirementType: 'LORE_DISCOVERED' as AchievementRequirement,
    requirementValue: 5,
    xpReward: 300,
    skillPointReward: 0,
    isSecret: false,
    sortOrder: 20,
  },
  {
    name: 'Truth Seeker',
    description: 'Discover 20 lore fragments',
    icon: '🕵️',
    category: 'LORE' as AchievementCategory,
    rarity: 'RARE' as AchievementRarity,
    requirementType: 'LORE_DISCOVERED' as AchievementRequirement,
    requirementValue: 20,
    xpReward: 1000,
    skillPointReward: 2,
    isSecret: false,
    sortOrder: 21,
  },

  // PROGRESSION ACHIEVEMENTS
  {
    name: 'Apprentice',
    description: 'Reach Level 10',
    icon: '🌟',
    category: 'PROGRESSION' as AchievementCategory,
    rarity: 'COMMON' as AchievementRarity,
    requirementType: 'REACH_LEVEL' as AchievementRequirement,
    requirementValue: 10,
    xpReward: 500,
    skillPointReward: 1,
    isSecret: false,
    sortOrder: 30,
  },
  {
    name: 'Expert',
    description: 'Reach Level 25',
    icon: '⭐',
    category: 'PROGRESSION' as AchievementCategory,
    rarity: 'UNCOMMON' as AchievementRarity,
    requirementType: 'REACH_LEVEL' as AchievementRequirement,
    requirementValue: 25,
    xpReward: 1000,
    skillPointReward: 2,
    isSecret: false,
    sortOrder: 31,
  },
  {
    name: 'Master',
    description: 'Reach Level 50',
    icon: '💫',
    category: 'PROGRESSION' as AchievementCategory,
    rarity: 'RARE' as AchievementRarity,
    requirementType: 'REACH_LEVEL' as AchievementRequirement,
    requirementValue: 50,
    xpReward: 2500,
    skillPointReward: 5,
    title: 'Master',
    isSecret: false,
    sortOrder: 32,
  },
  {
    name: 'Legend',
    description: 'Reach Level 100',
    icon: '✨',
    category: 'PROGRESSION' as AchievementCategory,
    rarity: 'LEGENDARY' as AchievementRarity,
    requirementType: 'REACH_LEVEL' as AchievementRequirement,
    requirementValue: 100,
    xpReward: 10000,
    skillPointReward: 10,
    title: 'Legend',
    isSecret: false,
    sortOrder: 33,
  },
  {
    name: 'Prestige',
    description: 'Reach Prestige Level 1',
    icon: '👑',
    category: 'PROGRESSION' as AchievementCategory,
    rarity: 'LEGENDARY' as AchievementRarity,
    requirementType: 'REACH_PRESTIGE' as AchievementRequirement,
    requirementValue: 1,
    xpReward: 5000,
    skillPointReward: 10,
    title: 'Prestige',
    isSecret: false,
    sortOrder: 34,
  },

  // CREATOR ACHIEVEMENTS
  {
    name: 'Storyteller',
    description: 'Submit 1 fan fiction',
    icon: '✍️',
    category: 'SOCIAL' as AchievementCategory,
    rarity: 'UNCOMMON' as AchievementRarity,
    requirementType: 'FAN_FICS_SUBMITTED' as AchievementRequirement,
    requirementValue: 1,
    xpReward: 500,
    skillPointReward: 1,
    isSecret: false,
    sortOrder: 40,
  },
  {
    name: 'Canonical Author',
    description: 'Submit 5 fan fictions',
    icon: '🖋️',
    category: 'SOCIAL' as AchievementCategory,
    rarity: 'RARE' as AchievementRarity,
    requirementType: 'FAN_FICS_SUBMITTED' as AchievementRequirement,
    requirementValue: 5,
    xpReward: 2000,
    skillPointReward: 3,
    title: 'Canonical Author',
    isSecret: false,
    sortOrder: 41,
  },

  // SPECIAL/SECRET ACHIEVEMENTS
  {
    name: 'Early Adopter',
    description: 'Be among the first 1,000 users',
    icon: '🚀',
    category: 'SPECIAL' as AchievementCategory,
    rarity: 'LEGENDARY' as AchievementRarity,
    requirementType: 'BETS_PLACED' as AchievementRequirement, // Placeholder
    requirementValue: 1,
    xpReward: 1000,
    skillPointReward: 3,
    title: 'Early Adopter',
    isSecret: true,
    sortOrder: 100,
  },
  {
    name: 'Whale Watcher',
    description: 'Place a single bet over 10,000 USDC',
    icon: '🐋',
    category: 'SPECIAL' as AchievementCategory,
    rarity: 'EPIC' as AchievementRarity,
    requirementType: 'TOTAL_PROFIT' as AchievementRequirement, // Placeholder
    requirementValue: 10000,
    xpReward: 2000,
    skillPointReward: 5,
    title: 'Whale',
    isSecret: true,
    sortOrder: 101,
  },
  {
    name: 'Perfect Predictor',
    description: 'Win 25 bets in a row',
    icon: '🎯',
    category: 'SPECIAL' as AchievementCategory,
    rarity: 'LEGENDARY' as AchievementRarity,
    requirementType: 'WIN_STREAK' as AchievementRequirement,
    requirementValue: 25,
    xpReward: 5000,
    skillPointReward: 10,
    title: 'Perfect Predictor',
    isSecret: true,
    sortOrder: 102,
  },
];

// ============================================================================
// QUESTS
// ============================================================================

const QUESTS = [
  // DAILY QUESTS
  {
    name: 'Daily Reader',
    description: 'Read 3 chapters today',
    icon: '📖',
    type: 'DAILY' as QuestType,
    difficulty: 'EASY' as QuestDifficulty,
    requirementType: 'READ_CHAPTERS' as QuestRequirement,
    requirementValue: 3,
    xpReward: 50,
    skillPointReward: 0,
    duration: 24,
    isActive: true,
  },
  {
    name: 'Daily Bettor',
    description: 'Place 2 bets today',
    icon: '🎲',
    type: 'DAILY' as QuestType,
    difficulty: 'EASY' as QuestDifficulty,
    requirementType: 'PLACE_BETS' as QuestRequirement,
    requirementValue: 2,
    xpReward: 75,
    skillPointReward: 0,
    duration: 24,
    isActive: true,
  },
  {
    name: 'Lucky Streak',
    description: 'Win 1 bet today',
    icon: '🍀',
    type: 'DAILY' as QuestType,
    difficulty: 'MEDIUM' as QuestDifficulty,
    requirementType: 'WIN_BETS' as QuestRequirement,
    requirementValue: 1,
    xpReward: 150,
    skillPointReward: 0,
    duration: 24,
    isActive: true,
  },
  {
    name: 'Lore Detective',
    description: 'Discover 1 lore fragment today',
    icon: '🔍',
    type: 'DAILY' as QuestType,
    difficulty: 'MEDIUM' as QuestDifficulty,
    requirementType: 'DISCOVER_LORE' as QuestRequirement,
    requirementValue: 1,
    xpReward: 200,
    skillPointReward: 0,
    duration: 24,
    isActive: true,
  },
  {
    name: 'Power Reader',
    description: 'Read 10 chapters today',
    icon: '📚',
    type: 'DAILY' as QuestType,
    difficulty: 'HARD' as QuestDifficulty,
    requirementType: 'READ_CHAPTERS' as QuestRequirement,
    requirementValue: 10,
    xpReward: 400,
    skillPointReward: 1,
    duration: 24,
    isActive: true,
  },
  {
    name: 'High Roller',
    description: 'Place 5 bets today',
    icon: '💎',
    type: 'DAILY' as QuestType,
    difficulty: 'HARD' as QuestDifficulty,
    requirementType: 'PLACE_BETS' as QuestRequirement,
    requirementValue: 5,
    xpReward: 300,
    skillPointReward: 0,
    duration: 24,
    isActive: true,
  },
  {
    name: 'Win Streak',
    description: 'Win 3 bets today',
    icon: '🔥',
    type: 'DAILY' as QuestType,
    difficulty: 'EPIC' as QuestDifficulty,
    requirementType: 'WIN_BETS' as QuestRequirement,
    requirementValue: 3,
    xpReward: 1000,
    skillPointReward: 2,
    duration: 24,
    isActive: true,
  },

  // WEEKLY QUESTS
  {
    name: 'Weekly Scholar',
    description: 'Read 25 chapters this week',
    icon: '🎓',
    type: 'WEEKLY' as QuestType,
    difficulty: 'MEDIUM' as QuestDifficulty,
    requirementType: 'READ_CHAPTERS' as QuestRequirement,
    requirementValue: 25,
    xpReward: 500,
    skillPointReward: 1,
    duration: 168,
    isActive: true,
  },
  {
    name: 'Weekly Gambler',
    description: 'Place 15 bets this week',
    icon: '🎰',
    type: 'WEEKLY' as QuestType,
    difficulty: 'MEDIUM' as QuestDifficulty,
    requirementType: 'PLACE_BETS' as QuestRequirement,
    requirementValue: 15,
    xpReward: 600,
    skillPointReward: 1,
    duration: 168,
    isActive: true,
  },
  {
    name: 'Weekly Champion',
    description: 'Win 10 bets this week',
    icon: '🏆',
    type: 'WEEKLY' as QuestType,
    difficulty: 'HARD' as QuestDifficulty,
    requirementType: 'WIN_BETS' as QuestRequirement,
    requirementValue: 10,
    xpReward: 1500,
    skillPointReward: 3,
    duration: 168,
    isActive: true,
  },
  {
    name: 'Lore Master',
    description: 'Discover 5 lore fragments this week',
    icon: '🗝️',
    type: 'WEEKLY' as QuestType,
    difficulty: 'HARD' as QuestDifficulty,
    requirementType: 'DISCOVER_LORE' as QuestRequirement,
    requirementValue: 5,
    xpReward: 2000,
    skillPointReward: 3,
    duration: 168,
    isActive: true,
  },
  {
    name: 'Creator Challenge',
    description: 'Submit 1 fan fiction this week',
    icon: '✍️',
    type: 'WEEKLY' as QuestType,
    difficulty: 'EPIC' as QuestDifficulty,
    requirementType: 'SUBMIT_FAN_FIC' as QuestRequirement,
    requirementValue: 1,
    xpReward: 3000,
    skillPointReward: 5,
    duration: 168,
    isActive: true,
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedProgressionSystem() {
  console.log('🌱 Seeding Prestige Progression System...');

  // Clear existing data (optional - for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('  🗑️  Clearing existing progression data...');
    await prisma.userQuest.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.quest.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.skillTree.deleteMany();
  }

  // Seed Skill Trees
  console.log('  🌳 Seeding Skill Trees...');
  for (const treeData of SKILL_TREES) {
    await prisma.skillTree.create({
      data: treeData,
    });
  }
  console.log(`  ✅ Created ${SKILL_TREES.length} skill trees`);

  // Seed Skills
  console.log('  💫 Seeding Skills...');
  for (const skillData of SKILLS) {
    const tree = await prisma.skillTree.findUnique({
      where: { name: skillData.treeName },
    });

    if (!tree) {
      console.error(`  ❌ Tree not found: ${skillData.treeName}`);
      continue;
    }

    // Resolve required skill IDs
    const requiredSkillIds: string[] = [];
    if (skillData.requiredSkills.length > 0) {
      for (const reqSkillName of skillData.requiredSkills) {
        const reqSkill = await prisma.skill.findFirst({
          where: {
            treeId: tree.id,
            name: reqSkillName,
          },
        });
        if (reqSkill) {
          requiredSkillIds.push(reqSkill.id);
        }
      }
    }

    await prisma.skill.create({
      data: {
        treeId: tree.id,
        name: skillData.name,
        description: skillData.description,
        icon: skillData.icon,
        tier: skillData.tier,
        requiredLevel: skillData.requiredLevel,
        requiredSkills: requiredSkillIds,
        skillPointCost: skillData.skillPointCost,
        benefits: skillData.benefits,
      },
    });
  }
  console.log(`  ✅ Created ${SKILLS.length} skills`);

  // Seed Achievements
  console.log('  🏆 Seeding Achievements...');
  for (const achievementData of ACHIEVEMENTS) {
    await prisma.achievement.create({
      data: achievementData,
    });
  }
  console.log(`  ✅ Created ${ACHIEVEMENTS.length} achievements`);

  // Seed Quests
  console.log('  📋 Seeding Quests...');
  for (const questData of QUESTS) {
    await prisma.quest.create({
      data: questData,
    });
  }
  console.log(`  ✅ Created ${QUESTS.length} quests`);

  console.log('✅ Prestige Progression System seeding complete!\n');
}

export default seedProgressionSystem;
