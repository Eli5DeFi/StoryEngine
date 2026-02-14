'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { GitBranch, Loader2, Sparkles } from 'lucide-react';

interface Choice {
  id: string;
  choiceNumber: number;
  text: string;
  isChosen: boolean;
  totalBets: number;
  betCount: number;
}

interface WhatIfExplorerProps {
  chapterId: string;
  choices: Choice[];
}

interface WhatIfResult {
  preview: string;
  aiModel: string;
  generatedAt: string;
  cached: boolean;
  viewCount: number;
}

export function WhatIfExplorer({ chapterId, choices }: WhatIfExplorerProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const winningChoice = choices.find((c) => c.isChosen);
  const alternateChoices = choices.filter((c) => !c.isChosen);

  const generateWhatIf = async (choiceId: string) => {
    setLoading(true);
    setError(null);
    setSelectedChoiceId(choiceId);

    try {
      const response = await fetch(`/api/chapters/${chapterId}/what-if/${choiceId}`);

      if (!response.ok) {
        throw new Error('Failed to generate what-if scenario');
      }

      const data = await response.json();
      setWhatIfResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (alternateChoices.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-5 h-5 text-neon-purple" />
        <h3 className="text-xl font-bold text-white">What If...?</h3>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Explore alternate timelines. What would have happened if a different choice had won?
      </p>

      {/* Current Path */}
      <div className="mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-green-400 font-medium">✓ CURRENT PATH</span>
        </div>
        <p className="text-sm text-gray-300">{winningChoice?.text}</p>
      </div>

      {/* Alternate Choices */}
      <div className="space-y-3 mb-6">
        {alternateChoices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => generateWhatIf(choice.id)}
            disabled={loading}
            className={`w-full p-3 border rounded-lg text-left transition-all ${
              selectedChoiceId === choice.id
                ? 'bg-purple-900/30 border-purple-500'
                : 'bg-gray-800/50 border-gray-700 hover:border-purple-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-purple-400 font-medium">ALTERNATE PATH {choice.choiceNumber}</span>
              {selectedChoiceId === choice.id && loading && (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>
            <p className="text-sm text-gray-300">{choice.text}</p>
            {choice.betCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {choice.betCount} {choice.betCount === 1 ? 'person' : 'people'} bet on this
              </p>
            )}
          </button>
        ))}
      </div>

      {/* What-If Result */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-8"
        >
          <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
          <span className="ml-2 text-gray-400">Generating alternate timeline...</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {whatIfResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Result */}
          <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="text-white font-medium">Alternate Timeline</h4>
              {whatIfResult.cached && (
                <span className="text-xs text-purple-400 bg-purple-900/50 px-2 py-1 rounded">
                  cached
                </span>
              )}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {whatIfResult.preview}
            </p>

            {/* Metadata */}
            <div className="mt-4 pt-3 border-t border-purple-700/30 flex items-center justify-between text-xs text-gray-500">
              <span>Generated by {whatIfResult.aiModel}</span>
              <span>{whatIfResult.viewCount} {whatIfResult.viewCount === 1 ? 'view' : 'views'}</span>
            </div>
          </div>

          {/* Share */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Copy to clipboard
                navigator.clipboard.writeText(whatIfResult.preview);
              }}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Copy Text
            </button>
            <button
              onClick={() => {
                // Share on Twitter
                const text = `What if the story had taken a different path? 🔮\n\n${whatIfResult.preview.slice(0, 200)}...`;
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                  '_blank'
                );
              }}
              className="flex-1 px-4 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue text-sm rounded-lg transition-colors"
            >
              Share
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
