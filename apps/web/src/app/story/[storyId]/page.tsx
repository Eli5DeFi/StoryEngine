'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Story, Chapter, BettingPool, Choice } from '@voidborne/database'
import { StoryHeader } from '@/components/story/StoryHeader'
import { ChapterReader } from '@/components/story/ChapterReader'
import { BettingInterface } from '@/components/story/BettingInterface'
import { ChapterNavigation } from '@/components/story/ChapterNavigation'
import { ClientOnly } from '@/components/ClientOnly'
import { ProphecyBanner } from '@/components/prophecy/ProphecyBanner'

type StoryWithChapters = Story & {
  chapters: (Chapter & {
    choices: (Choice & { _count: { bets: number } })[]
    bettingPool?: BettingPool & { _count: { bets: number } } | null
  })[]
}

export default function StoryPage() {
  const params = useParams()
  const storyId = params.storyId as string

  const [story, setStory] = useState<StoryWithChapters | null>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stories/${storyId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch story')
      }

      const data = await response.json()
      setStory(data)
      
      // Start at latest chapter
      if (data.chapters.length > 0) {
        setCurrentChapterIndex(data.chapters.length - 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    fetchStory()
  }, [fetchStory])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Story skeleton — matches page layout to reduce CLS */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8" aria-busy="true" aria-label="Loading story…">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-8 w-2/3 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
          </div>
          {/* Chapter body skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-white/5 rounded animate-pulse"
                style={{ width: i % 3 === 2 ? '70%' : '100%' }}
              />
            ))}
          </div>
          {/* Betting panel skeleton */}
          <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-foreground/70">{error || 'Story not found'}</p>
        </div>
      </div>
    )
  }

  const currentChapter = story.chapters[currentChapterIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Story Header */}
      <StoryHeader story={story} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Chapter Reader */}
          <div className="lg:col-span-2">
            <ChapterReader
              chapter={currentChapter}
              story={story}
            />

            {/* Chapter Navigation */}
            {story.chapters.length > 1 && (
              <ChapterNavigation
                chapters={story.chapters}
                currentIndex={currentChapterIndex}
                onChapterChange={setCurrentChapterIndex}
              />
            )}
          </div>

          {/* Sidebar - Betting Interface */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Prophecy NFT banner — tease open prophecies */}
              <ClientOnly>
                <ProphecyBanner chapterId={currentChapter.id} />
              </ClientOnly>

              {currentChapter.bettingPool && currentChapter.bettingPool.contractAddress && (
                <ClientOnly>
                  <BettingInterface
                    poolId={currentChapter.bettingPool.id}
                    contractAddress={currentChapter.bettingPool.contractAddress as `0x${string}`}
                    pool={currentChapter.bettingPool}
                    choices={currentChapter.choices}
                    onBetPlaced={fetchStory}
                  />
                </ClientOnly>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
