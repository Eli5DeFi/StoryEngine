'use client'

import Link from 'next/link'
import { BookOpen, Users, Coins, TrendingUp } from 'lucide-react'

// Mock data - will be replaced with real API calls
const featuredStories = [
  {
    id: '1',
    title: 'The Last Archive',
    description: 'In the ruins of a fallen civilization, an AI awakens to find fragments of human memory scattered across a dead network.',
    genre: 'Post-Apocalyptic Sci-Fi',
    currentChapter: 7,
    totalBets: '$47,320',
    activeBettors: 892,
    winRate: 91,
    coverGradient: 'from-drift-teal/20 to-drift-purple/20',
  },
  {
    id: '2',
    title: 'Dune Protocols',
    description: 'Three houses compete for control of the Spice—a resource that grants prescient AI the ability to see all possible futures.',
    genre: 'Space Opera',
    currentChapter: 4,
    totalBets: '$38,950',
    activeBettors: 654,
    winRate: 87,
    coverGradient: 'from-gold/20 to-drift-teal/20',
  },
  {
    id: '3',
    title: 'The Singing Sands',
    description: 'An exiled prophet discovers that the desert itself is alive—and it has been waiting millennia to speak.',
    genre: 'Mythological Fantasy',
    currentChapter: 9,
    totalBets: '$52,180',
    activeBettors: 1043,
    winRate: 93,
    coverGradient: 'from-drift-purple/20 to-gold/20',
  },
]

export function FeaturedStories() {
  return (
    <section id="stories" className="relative py-32 bg-gradient-to-b from-background to-void-950">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="text-ceremonial mb-4">
            Active Chronicles
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-gold gold-glow mb-6">
            Featured Stories
          </h2>
          <p className="text-xl text-void-300 max-w-2xl mx-auto">
            Join thousands of readers betting on AI-generated narratives
          </p>
        </div>

        {/* Story Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {featuredStories.map((story, index) => (
            <StoryCard key={story.id} story={story} index={index} />
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Link href="/stories" className="btn-secondary text-lg">
            View All Stories
          </Link>
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
          <BookOpen className="w-16 h-16 text-gold opacity-50 relative z-10 group-hover:scale-110 transition-transform duration-600" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Genre Badge */}
          <div className="text-xs font-ui uppercase tracking-wider text-gold mb-3">
            {story.genre}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-display font-bold text-foreground mb-3 group-hover:text-gold transition-colors duration-600">
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
            <div className="text-gold font-ui text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform duration-600">
              Read & Bet →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
