'use client'

import { Story } from '@narrative-forge/database'
import { ArrowLeft, Eye, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StoryHeaderProps {
  story: Story
}

export function StoryHeader({ story }: StoryHeaderProps) {
  const router = useRouter()

  return (
    <div className="relative h-96 overflow-hidden">
      {/* Cover Image */}
      {story.coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${story.coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>
      )}

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-8 left-4 flex items-center gap-2 text-foreground/80 hover:text-foreground transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Stories</span>
        </button>

        {/* Genre Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-4 w-fit">
          <span className="text-sm font-medium text-primary">{story.genre}</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4">{story.title}</h1>
        <p className="text-xl text-foreground/80 max-w-3xl mb-6">
          {story.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-foreground/70">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{story.viewCount.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-medium text-primary">
              {story.totalBets.toString()} FORGE wagered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{story.totalReaders.toLocaleString()} readers</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Chapter {story.currentChapter}/{story.totalChapters || '?'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
