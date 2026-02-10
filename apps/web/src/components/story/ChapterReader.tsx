'use client'

import { Chapter, Story } from '@voidborne/database'
import { Clock, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChapterReaderProps {
  chapter: Chapter
  story: Story
}

export function ChapterReader({ chapter, story }: ChapterReaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-xl p-8"
    >
      {/* Chapter Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 bg-primary/10 rounded-full">
            <span className="text-sm font-medium text-primary">
              Chapter {chapter.chapterNumber}
            </span>
          </div>
          {chapter.aiModel && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/10 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-500">AI Generated</span>
            </div>
          )}
          {chapter.readTime && (
            <div className="flex items-center gap-1 text-sm text-foreground/60">
              <Clock className="w-4 h-4" />
              <span>{chapter.readTime} min read</span>
            </div>
          )}
        </div>

        <h2 className="text-3xl font-bold mb-2">{chapter.title}</h2>
        
        {chapter.summary && (
          <p className="text-foreground/70 italic">{chapter.summary}</p>
        )}
      </div>

      {/* Chapter Image */}
      {chapter.headerImage && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={chapter.headerImage}
            alt={chapter.title}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Chapter Content */}
      <div className="prose prose-invert prose-lg max-w-none">
        {chapter.content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Chapter Footer */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between text-sm text-foreground/60">
          <div>
            Published {chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString() : 'Draft'}
          </div>
          {chapter.wordCount > 0 && (
            <div>
              {chapter.wordCount.toLocaleString()} words
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
