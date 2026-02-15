/**
 * Progression Dashboard
 * 
 * Displays user's:
 * - Level & XP progress
 * - Skill trees
 * - Achievements
 * - Daily/Weekly quests
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Mock user ID (replace with wallet address in production)
const MOCK_USER_ID = 'test-user-123';

interface ProgressData {
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  prestigeLevel: number;
  skillPointsAvailable: number;
  skills: any[];
  achievements: any[];
  quests: any[];
}

export default function ProgressionPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'skills' | 'achievements' | 'quests'>('skills');

  useEffect(() => {
    fetchProgressionData();
  }, []);

  const fetchProgressionData = async () => {
    try {
      const response = await fetch(`/api/progression/${MOCK_USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      }
    } catch (error) {
      console.error('Error fetching progression:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-purple-400 text-xl animate-pulse">Loading progression...</div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">Failed to load progression data</div>
      </div>
    );
  }

  const xpPercentage = (progressData.currentXP / progressData.xpToNextLevel) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Prestige Progression
          </h1>
          <p className="text-gray-400 text-lg">
            Level up, unlock skills, and become a legend
          </p>
        </motion.div>

        {/* Level & XP Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Level */}
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {progressData.level}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Level</div>
              {progressData.prestigeLevel > 0 && (
                <div className="mt-2 text-yellow-400 text-sm flex items-center justify-center gap-1">
                  <span>👑</span>
                  <span>Prestige {progressData.prestigeLevel}</span>
                </div>
              )}
            </div>

            {/* XP Progress */}
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Experience</span>
                <span className="text-sm text-purple-400 font-semibold">
                  {progressData.currentXP.toLocaleString()} / {progressData.xpToNextLevel.toLocaleString()} XP
                </span>
              </div>
              <div className="relative h-6 bg-slate-900/50 rounded-full overflow-hidden border border-purple-500/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-lg">
                  {Math.round(xpPercentage)}%
                </div>
              </div>

              {/* Skill Points */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
                  <span className="text-xl font-bold text-purple-400">{progressData.skillPointsAvailable}</span>
                  <span className="text-sm text-gray-400 ml-2">Skill Points Available</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-purple-500/20">
          {(['skills', 'achievements', 'quests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'skills' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <SkillTreeCard
              title="Bettor Tree 🎲"
              description="Master the art of prediction"
              minLevel={1}
              skills={3}
            />
            <SkillTreeCard
              title="Lore Hunter Tree 🔍"
              description="Uncover narrative secrets"
              minLevel={10}
              skills={5}
            />
            <SkillTreeCard
              title="Creator Tree ✍️"
              description="Shape the story"
              minLevel={20}
              skills={5}
            />
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {progressData.achievements.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No achievements yet. Start betting to unlock achievements!
              </div>
            ) : (
              progressData.achievements.map((achievement: any) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'quests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {progressData.quests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No active quests. Check back daily for new challenges!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progressData.quests.map((quest: any) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SkillTreeCard({ title, description, minLevel, skills }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 cursor-pointer transition-all hover:border-purple-500/50"
    >
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-purple-400">Min Level {minLevel}</span>
        <span className="text-gray-500">{skills} skills</span>
      </div>
    </motion.div>
  );
}

function AchievementCard({ achievement }: { achievement: any }) {
  const rarityColors = {
    COMMON: 'border-gray-500/30 bg-gray-900/30',
    UNCOMMON: 'border-green-500/30 bg-green-900/20',
    RARE: 'border-blue-500/30 bg-blue-900/20',
    EPIC: 'border-purple-500/30 bg-purple-900/20',
    LEGENDARY: 'border-yellow-500/30 bg-yellow-900/20',
  };

  const completed = achievement.progress >= achievement.requirementValue;
  const progressPercent = Math.min(
    100,
    (achievement.progress / achievement.requirementValue) * 100
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-lg border p-4 transition-all ${
        rarityColors[achievement.rarity as keyof typeof rarityColors]
      } ${completed ? 'opacity-100' : 'opacity-60'}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{achievement.name}</h4>
          <p className="text-xs text-gray-400">{achievement.description}</p>
        </div>
        {completed && <div className="text-green-400">✓</div>}
      </div>

      {!completed && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {achievement.progress} / {achievement.requirementValue}
            </span>
          </div>
          <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>+{achievement.xpReward} XP</span>
        {achievement.skillPointReward > 0 && (
          <span>+{achievement.skillPointReward} SP</span>
        )}
        <span className="ml-auto capitalize">{achievement.rarity.toLowerCase()}</span>
      </div>
    </motion.div>
  );
}

function QuestCard({ quest }: { quest: any }) {
  const completed = quest.isCompleted;
  const progressPercent = Math.min(
    100,
    (quest.progress / quest.quest.requirementValue) * 100
  );

  const difficultyColors = {
    EASY: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HARD: 'text-orange-400',
    EPIC: 'text-purple-400',
  };

  // Calculate time remaining
  const timeRemaining = quest.expiresAt
    ? Math.max(0, new Date(quest.expiresAt).getTime() - Date.now())
    : 0;
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 ${
        completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl">{quest.quest.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white">{quest.quest.name}</h4>
            {completed && <div className="text-green-400 text-sm">✓ Complete</div>}
          </div>
          <p className="text-sm text-gray-400">{quest.quest.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>
            {quest.progress} / {quest.quest.requirementValue}
          </span>
        </div>
        <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-gray-500">
          <span>+{quest.quest.xpReward} XP</span>
          {quest.quest.skillPointReward > 0 && (
            <span>+{quest.quest.skillPointReward} SP</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={difficultyColors[quest.quest.difficulty as keyof typeof difficultyColors]}>
            {quest.quest.difficulty}
          </span>
          {!completed && (
            <span className="text-gray-500">
              {hoursRemaining}h {minutesRemaining}m left
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
