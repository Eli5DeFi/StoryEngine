'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Twitter, MessageSquare, Send, Copy, Check } from 'lucide-react'

type ShareButtonProps = {
  type: 'bet' | 'win' | 'streak' | 'profile'
  betId?: string
  userId?: string
  label?: string
  variant?: 'default' | 'compact'
}

export function ShareButton({
  type,
  betId,
  userId,
  label = 'Share',
  variant = 'default',
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareData, setShareData] = useState<any>(null)

  async function handleShare() {
    if (shareData) {
      setShowMenu(!showMenu)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, betId, userId }),
      })

      if (!response.ok) throw new Error('Failed to generate share link')

      const data = await response.json()
      setShareData(data)
      setShowMenu(true)
    } catch (error) {
      console.error('Share error:', error)
      alert('Failed to generate share link')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    if (!shareData) return

    const text = `${shareData.shareText}\n\n${shareData.shareUrl}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const platforms = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: shareData?.shareUrls?.twitter,
      color: 'hover:bg-blue-500/20 hover:text-blue-400',
    },
    {
      name: 'Farcaster',
      icon: MessageSquare,
      url: shareData?.shareUrls?.farcaster,
      color: 'hover:bg-purple-500/20 hover:text-purple-400',
    },
    {
      name: 'Telegram',
      icon: Send,
      url: shareData?.shareUrls?.telegram,
      color: 'hover:bg-blue-400/20 hover:text-blue-300',
    },
  ]

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={handleShare}
        disabled={loading}
        className={`
          inline-flex items-center gap-2 font-medium rounded-lg transition-all
          ${
            variant === 'compact'
              ? 'px-3 py-1.5 text-sm'
              : 'px-4 py-2'
          }
          ${
            loading
              ? 'bg-void-800 text-foreground/40 cursor-not-allowed'
              : 'bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20'
          }
        `}
      >
        <Share2 className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
        {loading ? 'Loading...' : label}
      </button>

      {/* Share Menu */}
      <AnimatePresence>
        {showMenu && shareData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-void-900 border border-gold/20 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gold/10">
              <h4 className="font-bold text-gold text-sm">Share your {type}</h4>
              <p className="text-xs text-foreground/60 mt-1">
                Let everyone know about your prediction!
              </p>
            </div>

            {/* Platforms */}
            <div className="p-2">
              {platforms.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all text-foreground/80
                    ${platform.color}
                  `}
                >
                  <platform.icon className="w-5 h-5" />
                  <span className="font-medium">Share on {platform.name}</span>
                </a>
              ))}

              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-foreground/80 hover:bg-gold/20 hover:text-gold mt-1"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="font-medium">Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="px-4 py-3 border-t border-gold/10 bg-void-950/50">
              <p className="text-xs text-foreground/60 line-clamp-3">
                {shareData.shareText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
