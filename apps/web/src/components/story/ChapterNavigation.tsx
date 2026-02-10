'use client'

import { Chapter } from '@voidborne/database'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChapterNavigationProps {
  chapters: Chapter[]
  currentIndex: number
  onChapterChange: (index: number) => void
}

export function ChapterNavigation({
  chapters,
  currentIndex,
  onChapterChange,
}: ChapterNavigationProps) {
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < chapters.length - 1

  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      {/* Previous Chapter */}
      {hasPrevious ? (
        <Button
          onClick={() => onChapterChange(currentIndex - 1)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <div className="text-left">
            <div className="text-xs text-foreground/60">Previous</div>
            <div className="font-medium">Chapter {chapters[currentIndex - 1].chapterNumber}</div>
          </div>
        </Button>
      ) : (
        <div />
      )}

      {/* Chapter Indicator */}
      <div className="flex items-center gap-2">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => onChapterChange(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary w-8'
                : 'bg-foreground/20 hover:bg-foreground/40'
            }`}
            aria-label={`Go to chapter ${chapter.chapterNumber}`}
          />
        ))}
      </div>

      {/* Next Chapter */}
      {hasNext ? (
        <Button
          onClick={() => onChapterChange(currentIndex + 1)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <div className="text-right">
            <div className="text-xs text-foreground/60">Next</div>
            <div className="font-medium">Chapter {chapters[currentIndex + 1].chapterNumber}</div>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>
      ) : (
        <div />
      )}
    </div>
  )
}
