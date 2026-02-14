'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Flame, Zap, Activity } from 'lucide-react';

interface NVIScore {
  chapterId: string;
  poolId: string;
  storyTitle: string;
  chapterNumber: number;
  nviValue: number;
  entropy: number;
  aiVariance: number;
  confidence: number;
  totalPool: number;
  closesAt: Date;
  urgency: 'calm' | 'moderate' | 'high' | 'critical';
}

interface MarketStats {
  totalPools: number;
  avgNVI: number;
  highestNVI: number;
  lowestNVI: number;
  totalVolume: number;
  volatileStories: number;
  stableStories: number;
}

interface DashboardData {
  nviScores: NVIScore[];
  marketStats: MarketStats;
  trending: (NVIScore & { momentum: number })[];
}

export function NVIDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboard() {
    try {
      const response = await fetch('/api/nvi/dashboard');
      const result = await response.json();
      
      if (result.success) {
        // Convert date strings back to Date objects
        const processedData = {
          ...result.data,
          nviScores: result.data.nviScores.map((score: any) => ({
            ...score,
            closesAt: new Date(score.closesAt),
          })),
          trending: result.data.trending.map((score: any) => ({
            ...score,
            closesAt: new Date(score.closesAt),
          })),
        };
        setData(processedData);
        setError(null);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Error fetching NVI dashboard:', err);
      setError('Network error - please refresh');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neon-green text-xl font-mono animate-pulse">
          LOADING NVI TERMINAL...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl font-mono">
          ERROR: {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-blue to-neon-pink">
          NVI TERMINAL
        </h1>
        <p className="text-gray-400 font-mono">
          Narrative Volatility Index · Professional Story Trading
        </p>
      </motion.div>

      {/* Market Stats */}
      <MarketStatsPanel stats={data.marketStats} />

      {/* Trending Volatility */}
      <TrendingSection trending={data.trending} />

      {/* All NVI Scores */}
      <NVIScoresGrid scores={data.nviScores} />
    </div>
  );
}

function MarketStatsPanel({ stats }: { stats: MarketStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
    >
      <StatCard
        label="Active Pools"
        value={stats.totalPools}
        icon={<Activity />}
        color="text-neon-blue"
      />
      <StatCard
        label="Avg NVI"
        value={stats.avgNVI.toFixed(1)}
        icon={<TrendingUp />}
        color="text-neon-green"
      />
      <StatCard
        label="Total Volume"
        value={`$${(stats.totalVolume / 1000).toFixed(1)}K`}
        icon={<Zap />}
        color="text-yellow-400"
      />
      <StatCard
        label="Volatile Stories"
        value={stats.volatileStories}
        icon={<Flame />}
        color="text-orange-500"
        subtitle="NVI ≥70"
      />
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-neon-green/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm font-mono">{label}</span>
        <div className={color}>{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

function TrendingSection({
  trending,
}: {
  trending: (NVIScore & { momentum: number })[];
}) {
  if (trending.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-neon-green font-mono">
        🔥 TRENDING VOLATILITY
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trending.map((score) => (
          <NVICard key={score.chapterId} score={score} featured />
        ))}
      </div>
    </div>
  );
}

function NVIScoresGrid({ scores }: { scores: NVIScore[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-white font-mono">
        ALL MARKETS
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {scores.map((score) => (
          <NVICard key={score.chapterId} score={score} />
        ))}
      </div>
    </div>
  );
}

function NVICard({
  score,
  featured = false,
}: {
  score: NVIScore;
  featured?: boolean;
}) {
  const volatilityLevel = getVolatilityLevel(score.nviValue);
  const urgencyColor = getUrgencyColor(score.urgency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`
        bg-gray-900 border rounded-lg p-4 cursor-pointer
        hover:shadow-lg hover:shadow-neon-green/20 transition-all
        ${featured ? 'border-neon-green' : 'border-gray-800'}
      `}
      onClick={() => window.location.href = `/story/${score.poolId}`}
    >
      {/* Story Title */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-white truncate">
          {score.storyTitle}
        </h3>
        <p className="text-sm text-gray-400">Chapter {score.chapterNumber}</p>
      </div>

      {/* NVI Score - Big and Bold */}
      <div className="mb-4 text-center">
        <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">
          {score.nviValue}
        </div>
        <div className="text-sm text-gray-400 font-mono mt-1">
          {volatilityLevel}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2 mb-4">
        <MetricBar
          label="Entropy"
          value={score.entropy}
          max={1}
          color="bg-blue-500"
        />
        <MetricBar
          label="AI Variance"
          value={score.aiVariance}
          max={1}
          color="bg-purple-500"
        />
        <MetricBar
          label="Confidence"
          value={score.confidence}
          max={1}
          color="bg-green-500"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          Pool: ${(score.totalPool / 1000).toFixed(1)}K
        </span>
        <span className={`font-mono ${urgencyColor}`}>
          {score.urgency.toUpperCase()}
        </span>
      </div>

      {featured && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <button className="w-full bg-gradient-to-r from-neon-green to-neon-blue text-black font-bold py-2 rounded hover:opacity-90 transition-opacity">
            TRADE OPTIONS
          </button>
        </div>
      )}
    </motion.div>
  );
}

function MetricBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function getVolatilityLevel(nvi: number): string {
  if (nvi >= 80) return 'EXTREME';
  if (nvi >= 70) return 'HIGH';
  if (nvi >= 50) return 'MODERATE';
  if (nvi >= 30) return 'LOW';
  return 'STABLE';
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'moderate':
      return 'text-yellow-500';
    default:
      return 'text-green-500';
  }
}
