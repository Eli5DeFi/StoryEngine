'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingDown, Flame } from 'lucide-react'

interface Props {
  streak: number
  onClose: () => void
  onStartFresh: () => void
}

export function StreakBrokenModal({ streak, onClose, onStartFresh }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="glass-card p-8 rounded-2xl max-w-md w-full border-2 border-red-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
              <TrendingDown className="w-10 h-10 text-red-500" />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center mb-6">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-display font-bold text-foreground mb-2"
            >
              Streak Broken
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-void-400"
            >
              Your {streak}-win streak has ended
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-void-950 border border-void-800 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-void-500 mb-1">Final Streak</p>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <span className="text-2xl font-display font-bold text-foreground">
                    {streak}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-void-500 mb-1">Lost Multiplier</p>
                <span className="text-2xl font-display font-bold text-red-500">
                  {(1 + streak * 0.1).toFixed(1)}x
                </span>
              </div>
            </div>
          </motion.div>

          {/* Motivation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <p className="text-sm text-void-400">
              Every champion has losses. The difference is they get back up.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3"
          >
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-void-900 hover:bg-void-800 text-foreground font-ui font-semibold rounded-xl transition-all"
            >
              Close
            </button>
            <button
              onClick={onStartFresh}
              className="flex-1 px-6 py-3 bg-gold hover:bg-gold/80 text-void-950 font-ui font-semibold rounded-xl transition-all"
            >
              Start Fresh 🔥
            </button>
          </motion.div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-void-400" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
