'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { CharacterProfile } from './CharacterProfile';

interface Character {
  id: string;
  name: string;
  description: string;
  portrait?: string;
  traits: Record<string, number>;
  firstAppearance: number;
  lastAppearance: number;
  totalAppearances: number;
  memories: any[];
  relationships: any[];
}

interface CharacterGridProps {
  characters: Character[];
}

export function CharacterGrid({ characters }: CharacterGridProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No characters discovered yet</p>
        <p className="text-sm mt-2">Characters will appear as the story progresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Character Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character, index) => (
          <motion.button
            key={character.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedCharacter(character)}
            className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-neon-blue transition-colors text-left group"
          >
            {/* Portrait */}
            <div className="relative w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 group-hover:border-neon-blue overflow-hidden mb-3 transition-colors">
              {character.portrait ? (
                <Image
                  src={character.portrait}
                  alt={character.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-600 group-hover:text-neon-blue transition-colors" />
                </div>
              )}
            </div>

            {/* Info */}
            <h3 className="text-white font-bold mb-1 group-hover:text-neon-blue transition-colors">
              {character.name}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2 mb-2">
              {character.description}
            </p>

            {/* Stats */}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{character.totalAppearances} appearances</span>
              <span>
                Ch. {character.firstAppearance}–{character.lastAppearance}
              </span>
            </div>

            {/* Memories & Relationships badges */}
            <div className="flex gap-2 mt-3">
              {character.memories.length > 0 && (
                <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                  {character.memories.length} memories
                </span>
              )}
              {character.relationships.length > 0 && (
                <span className="px-2 py-1 bg-pink-900/30 text-pink-400 text-xs rounded">
                  {character.relationships.length} relationships
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Character Profile Modal */}
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCharacter(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedCharacter(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
              <CharacterProfile
                character={selectedCharacter}
                showMemories={true}
                showRelationships={true}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
