'use client'

import Link from 'next/link'
import { BookOpen, Users, Coins, TrendingUp } from 'lucide-react'

// The Voidborne story - only featured story
const featuredStories = [
  {
    id: '1',
    title: 'VOIDBORNE: The Silent Throne',
    description: 'Heir to House Valdris, you must navigate deadly succession politics as someone learns to Stitch new Threads—an art thought impossible. Five perspectives. Five agendas. One choice that could shatter reality.',
    genre: 'Space Political Sci-Fi',
    currentChapter: 1,
    totalBets: '$0',
    activeBettors: 0,
    winRate: 0,
    coverGradient: 'from-gold/20 via-drift-teal/10 to-void-900',
  },
]

export function FeaturedStories() {
  return (
    <section id="stories" className="relative py-32 bg-gradient-to-b from-background to-void-950">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="text-ceremonial mb-4">
            The Chronicle
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-gold gold-glow mb-6">
            VOIDBORNE: The Silent Throne
          </h2>
          <p className="text-xl text-void-300 max-w-2xl mx-auto">
            Navigate deadly succession politics. Bet on which path shapes the narrative.
          </p>
        </div>

        {/* Story Card - Centered */}
        <div className="max-w-2xl mx-auto">
          {featuredStories.map((story, index) => (
            <StoryCard key={story.id} story={story} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface StoryCardProps {
  story: typeof featuredStories[0]
  index: number
}

function StoryCard({ story, index }: StoryCardProps) {
  return (
    <Link href={`/story/${story.id}`}>
      <div className={`glass-card p-6 rounded-2xl h-full flex flex-col opacity-0 ambient-fade stagger-${index + 1} group cursor-pointer`}>
        {/* Cover */}
        <div className={`relative h-48 rounded-xl mb-6 bg-gradient-to-br ${story.coverGradient} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 starfield-bg opacity-50" />
          <BookOpen className="w-16 h-16 text-gold opacity-50 relative z-10 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Genre Badge */}
          <div className="text-xs font-ui uppercase tracking-wider text-gold mb-3">
            {story.genre}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-display font-bold text-foreground mb-3 group-hover:text-gold transition-colors duration-500">
            {story.title}
          </h3>

          {/* Description */}
          <p className="text-void-300 text-sm leading-relaxed mb-6 flex-1">
            {story.description}
          </p>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-void-400">
                <BookOpen className="w-4 h-4" />
                <span>Chapter {story.currentChapter}</span>
              </div>
              <div className="flex items-center gap-2 text-drift-teal">
                <TrendingUp className="w-4 h-4" />
                <span>{story.winRate}% win rate</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-void-400">
                <Coins className="w-4 h-4" />
                <span className="font-ui tabular-nums">{story.totalBets}</span>
              </div>
              <div className="flex items-center gap-2 text-void-400">
                <Users className="w-4 h-4" />
                <span className="font-ui tabular-nums">{story.activeBettors}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 pt-6 border-t border-void-800">
            <div className="text-gold font-ui text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform duration-500">
              Read & Bet →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
