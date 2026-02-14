'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { User, Heart, Zap, Eye, Calendar } from 'lucide-react';

interface CharacterTrait {
  name: string;
  value: number;
}

interface CharacterMemory {
  id: string;
  eventType: 'DECISION' | 'RELATIONSHIP' | 'REVELATION' | 'TRAUMA' | 'ACHIEVEMENT';
  description: string;
  emotionalImpact: number;
  importance: number;
  createdAt: string;
}

interface CharacterRelationship {
  id: string;
  character: {
    id: string;
    name: string;
  };
  type: string;
  score: number;
  history: Array<{
    chapter: number;
    event: string;
    delta: number;
  }>;
}

interface CharacterProfileProps {
  character: {
    id: string;
    name: string;
    description: string;
    portrait?: string;
    traits: Record<string, number>;
    firstAppearance: number;
    lastAppearance: number;
    totalAppearances: number;
    memories: CharacterMemory[];
    relationships: CharacterRelationship[];
  };
  showMemories?: boolean;
  showRelationships?: boolean;
}

const memoryTypeColors = {
  DECISION: 'text-blue-400',
  RELATIONSHIP: 'text-pink-400',
  REVELATION: 'text-purple-400',
  TRAUMA: 'text-red-400',
  ACHIEVEMENT: 'text-green-400',
};

const memoryTypeIcons = {
  DECISION: '⚖️',
  RELATIONSHIP: '💖',
  REVELATION: '💡',
  TRAUMA: '💔',
  ACHIEVEMENT: '🏆',
};

export function CharacterProfile({
  character,
  showMemories = true,
  showRelationships = true,
}: CharacterProfileProps) {
  const [activeTab, setActiveTab] = useState<'traits' | 'memories' | 'relationships'>('traits');

  const traits: CharacterTrait[] = Object.entries(character.traits).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Portrait */}
        <div className="relative w-20 h-20 rounded-full bg-gray-800 border-2 border-neon-blue overflow-hidden flex-shrink-0">
          {character.portrait ? (
            <img
              src={character.portrait}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-gray-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1">{character.name}</h3>
          <p className="text-gray-400 text-sm mb-2">{character.description}</p>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Ch. {character.firstAppearance}–{character.lastAppearance}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {character.totalAppearances} appearances
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('traits')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'traits'
              ? 'text-neon-blue border-b-2 border-neon-blue'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Traits
        </button>
        {showMemories && character.memories.length > 0 && (
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'memories'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Memories ({character.memories.length})
          </button>
        )}
        {showRelationships && character.relationships.length > 0 && (
          <button
            onClick={() => setActiveTab('relationships')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'relationships'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Relationships ({character.relationships.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        {/* Traits */}
        {activeTab === 'traits' && (
          <div className="space-y-3">
            {traits.map((trait) => (
              <div key={trait.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 capitalize">{trait.name}</span>
                  <span className="text-neon-green font-mono">{Math.round(trait.value * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trait.value * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-green"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Memories */}
        {activeTab === 'memories' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {character.memories.map((memory) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-700 rounded-lg p-3 bg-gray-800/50"
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl flex-shrink-0">
                    {memoryTypeIcons[memory.eventType]}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${memoryTypeColors[memory.eventType]}`}>
                        {memory.eventType}
                      </span>
                      <span className="text-xs text-gray-500">
                        Impact: {memory.emotionalImpact > 0 ? '+' : ''}
                        {memory.emotionalImpact.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Importance: {memory.importance}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{memory.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Relationships */}
        {activeTab === 'relationships' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {character.relationships.map((rel) => (
              <motion.div
                key={rel.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-700 rounded-lg p-3 bg-gray-800/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{rel.character.name}</h4>
                    <span className="text-xs text-gray-500">{rel.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Heart
                        className={`w-4 h-4 ${
                          rel.score > 0 ? 'text-pink-400' : 'text-red-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-mono ${
                          rel.score > 0 ? 'text-pink-400' : 'text-red-400'
                        }`}
                      >
                        {rel.score > 0 ? '+' : ''}
                        {rel.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Relationship history */}
                {Array.isArray(rel.history) && rel.history.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Latest event:</p>
                    <p className="text-sm text-gray-300">
                      {rel.history[rel.history.length - 1].event}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
