'use client'

import { useState } from 'react'
import { Share2, Twitter, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ShareButtonProps {
  type: 'bet' | 'story' | 'profile' | 'leaderboard'
  id: string
  text: string
  url?: string
  compact?: boolean
}

export function ShareButton({ type, id, text, url, compact = false }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = url || `${window.location.origin}/${type}/${id}`
  const ogImageUrl = `${window.location.origin}/api/share/og-image?type=${type}&id=${id}`

  const handleTwitterShare = () => {
    const twitterText = encodeURIComponent(text)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
    setShowMenu(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowMenu(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-void-800/50 hover:bg-void-800 text-foreground/70 hover:text-foreground transition-all text-sm"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-void-800 hover:border-gold/50 transition-all text-sm font-semibold text-foreground group"
      >
        <Share2 className="w-4 h-4 group-hover:text-gold transition-colors" />
        <span>Share</span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 glass-card rounded-xl border border-void-800 overflow-hidden shadow-xl z-50"
            >
              <div className="p-2 space-y-1">
                {/* Twitter */}
                <button
                  onClick={handleTwitterShare}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-void-800/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                    <Twitter className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Share on X
                    </div>
                    <div className="text-xs text-foreground/50">
                      Post to your timeline
                    </div>
                  </div>
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-void-800/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    {copied ? (
                      <Check className="w-4 h-4 text-gold" />
                    ) : (
                      <Copy className="w-4 h-4 text-gold" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {copied ? 'Copied!' : 'Copy Link'}
                    </div>
                    <div className="text-xs text-foreground/50">
                      {copied ? 'Link copied to clipboard' : 'Share anywhere'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Referral Info */}
              {type === 'profile' && (
                <div className="px-4 py-3 bg-void-950/50 border-t border-void-800">
                  <div className="text-xs text-foreground/70">
                    <span className="text-gold font-semibold">Earn 5%</span> of your
                    friend&apos;s first bet!
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Compact share button for tables/cards
 */
export function ShareIcon({ type, id, text, url }: ShareButtonProps) {
  const shareUrl = url || `${window.location.origin}/${type}/${id}`

  const handleShare = () => {
    const twitterText = encodeURIComponent(text)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-lg hover:bg-void-800/50 text-foreground/50 hover:text-gold transition-all"
      title="Share on X"
    >
      <Share2 className="w-4 h-4" />
    </button>
  )
}
