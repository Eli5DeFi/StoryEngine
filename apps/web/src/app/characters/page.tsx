'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Character {
  characterId: string
  name: string
  house: string
  currentState: {
    chapterId: number
    emotionalState: string
    location: string
  }
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/character-chat')
      .then(res => res.json())
      .then(data => {
        setCharacters(data.characters || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load characters:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading characters...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Character Consciousness Protocol
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Chat with the characters of Voidborne. Build relationships, unlock secrets, and influence the narrative.
          </p>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character, index) => (
            <motion.div
              key={character.characterId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/characters/${character.characterId}`}>
                <div className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer h-full">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative p-6">
                    {/* Character Header */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {character.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {character.house}
                      </p>
                    </div>

                    {/* Current State */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 min-w-fit">Chapter:</span>
                        <span className="text-gray-300">{character.currentState.chapterId}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 min-w-fit">State:</span>
                        <span className="text-gray-300">{character.currentState.emotionalState}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 min-w-fit">Location:</span>
                        <span className="text-gray-300">{character.currentState.location}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-6 pt-4 border-t border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Start Conversation</span>
                        <svg 
                          className="w-5 h-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-blue-400 text-3xl mb-3">🤝</div>
            <h3 className="text-lg font-bold text-white mb-2">Build Relationships</h3>
            <p className="text-gray-400 text-sm">
              Gain XP with every conversation. Level up from Stranger to Soulbound.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-blue-400 text-3xl mb-3">🔓</div>
            <h3 className="text-lg font-bold text-white mb-2">Unlock Secrets</h3>
            <p className="text-gray-400 text-sm">
              Higher relationship levels unlock deeper secrets and backstory.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-blue-400 text-3xl mb-3">💬</div>
            <h3 className="text-lg font-bold text-white mb-2">Influence Story</h3>
            <p className="text-gray-400 text-sm">
              Your conversations shape character development and plot outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
