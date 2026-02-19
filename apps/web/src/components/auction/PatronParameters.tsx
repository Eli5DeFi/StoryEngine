'use client'

/**
 * PatronParameters — Let the auction winner configure their chapter.
 *
 * Only shown to the winner after the auction ends.
 * The winner picks:
 *   - Genre (Heist | Romance | Horror | War | Mystery | Revelation)
 *   - House spotlight (which House gets screen time)
 *   - Story twist (from curated list based on genre)
 *   - Optional custom notes (200 chars)
 *
 * Submits to /api/auction/[chapterId]/configure
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, CheckCircle2, Loader2 } from 'lucide-react'

type Genre = 'Heist' | 'Romance' | 'Horror' | 'War' | 'Mystery' | 'Revelation'
type House = 'valdris' | 'obsidian' | 'meridian' | 'solace' | 'void'

const GENRES: { id: Genre; label: string; emoji: string; description: string }[] = [
  { id: 'Heist', label: 'Heist', emoji: '🎭', description: 'High-stakes infiltration, trust betrayed, impossible odds' },
  { id: 'Romance', label: 'Romance', emoji: '🌹', description: 'Forbidden connection across House lines' },
  { id: 'Horror', label: 'Horror', emoji: '🌑', description: 'Void corruption, paranoia, things that should not exist' },
  { id: 'War', label: 'War', emoji: '⚔️', description: 'Open conflict, fleet movements, decisive battles' },
  { id: 'Mystery', label: 'Mystery', emoji: '🔎', description: 'Hidden truths, false identities, ancient conspiracies' },
  { id: 'Revelation', label: 'Revelation', emoji: '✨', description: 'Cosmic truth unveiled — changes the story forever' },
]

const HOUSES: { id: House; label: string; emoji: string }[] = [
  { id: 'valdris', label: 'House Valdris', emoji: '👑' },
  { id: 'obsidian', label: 'House Obsidian', emoji: '🖤' },
  { id: 'meridian', label: 'House Meridian', emoji: '🌊' },
  { id: 'solace', label: 'House Solace', emoji: '🌿' },
  { id: 'void', label: 'The Void', emoji: '🌀' },
]

const TWISTS_BY_GENRE: Record<Genre, string[]> = {
  Heist: [
    'The stolen artifact was never the real prize.',
    'One of the crew was a double agent from the start.',
    'The vault was empty — the heist was the distraction.',
    'The target discovers the plan and flips it.',
  ],
  Romance: [
    'A forbidden union is proposed — and accepted.',
    'The lovers are revealed to be blood rivals.',
    'The romance was arranged — but became real.',
    'A letter arrives that changes everything.',
  ],
  Horror: [
    'The highest ally reveals the deepest wound.',
    'The corruption spreads to the protagonist.',
    'What they feared most was already inside them.',
    'The monster was always human.',
  ],
  War: [
    'The winning side loses something it cannot replace.',
    'Ceasefire — but at an impossible price.',
    'The enemy was fighting the same battle.',
    'Victory reveals the true enemy was never the foe.',
  ],
  Mystery: [
    'The Void Gate is not a place — it is a person.',
    'The detective is the killer.',
    'The conspiracy reaches higher than imagined.',
    'The truth is worse than the lie.',
  ],
  Revelation: [
    'The Silent Throne was never meant to be sat upon.',
    'The prophecy was manufactured.',
    'There are six Houses, not five.',
    'The story is a simulation.',
  ],
}

interface PatronParametersProps {
  chapterNumber: number
  onSubmit: (params: { genre: Genre; spotlightHouse: House; twist: string; customNotes?: string }) => void
}

export function PatronParameters({ chapterNumber, onSubmit }: PatronParametersProps) {
  const [genre, setGenre] = useState<Genre | null>(null)
  const [house, setHouse] = useState<House | null>(null)
  const [twist, setTwist] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'idle' | 'submitting' | 'done'>('idle')

  const availableTwists = genre ? TWISTS_BY_GENRE[genre] : []
  const canSubmit = genre && house && twist && step === 'idle'

  async function handleSubmit() {
    if (!genre || !house || !twist) return
    setStep('submitting')
    await new Promise((r) => setTimeout(r, 1500)) // simulate API
    onSubmit({ genre, spotlightHouse: house, twist, customNotes: notes || undefined })
    setStep('done')
  }

  if (step === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-4"
      >
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
        <h3 className="text-foreground font-display font-bold text-xl">Chapter Parameters Set!</h3>
        <p className="text-void-400 text-sm">
          Your parameters have been locked in. The AI will use them when generating Chapter {chapterNumber}.
          Your Patron NFT will be minted after the chapter publishes.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground font-display font-bold text-lg mb-1">Configure Your Chapter</h3>
        <p className="text-void-400 text-sm">
          As Patron of Chapter {chapterNumber}, you set the stage. Choose wisely — this is canon.
        </p>
      </div>

      {/* Genre selection */}
      <div className="space-y-3">
        <label className="text-xs text-void-400 uppercase tracking-wider font-ui">Genre</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setGenre(g.id)
                setTwist(null) // reset twist when genre changes
              }}
              className={`p-3 rounded-xl border text-left transition-all text-sm ${
                genre === g.id
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-void-800 bg-void-950/40 text-void-300 hover:border-void-600'
              }`}
            >
              <div className="text-lg mb-1">{g.emoji}</div>
              <div className="font-bold">{g.label}</div>
              <div className="text-[10px] text-void-500 leading-tight mt-0.5 line-clamp-2">
                {g.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* House spotlight */}
      <div className="space-y-3">
        <label className="text-xs text-void-400 uppercase tracking-wider font-ui">House Spotlight</label>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {HOUSES.map((h) => (
            <button
              key={h.id}
              onClick={() => setHouse(h.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                house === h.id
                  ? 'border-drift-purple bg-drift-purple/10 text-drift-purple'
                  : 'border-void-800 bg-void-950/40 text-void-300 hover:border-void-600'
              }`}
            >
              <div className="text-xl mb-1">{h.emoji}</div>
              <div className="text-xs font-bold">{h.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Story twist */}
      {genre && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="text-xs text-void-400 uppercase tracking-wider font-ui">Story Twist</label>
          <div className="space-y-2">
            {availableTwists.map((t) => (
              <button
                key={t}
                onClick={() => setTwist(t)}
                className={`w-full p-3 rounded-xl border text-left text-sm transition-all ${
                  twist === t
                    ? 'border-drift-teal bg-drift-teal/10 text-drift-teal'
                    : 'border-void-800 bg-void-950/40 text-void-300 hover:border-void-600'
                }`}
              >
                "{t}"
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Optional custom notes */}
      <div className="space-y-2">
        <label className="text-xs text-void-400 uppercase tracking-wider font-ui">
          Custom Notes (optional, 200 chars)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 200))}
          placeholder="Additional tone direction for the AI... 'Make it bleak. No false hope.'"
          rows={3}
          className="w-full bg-void-900 border border-void-700 rounded-lg p-3 text-void-200 text-sm
                     resize-none focus:outline-none focus:border-gold transition-colors placeholder:text-void-600"
        />
        <p className="text-void-600 text-xs text-right">{notes.length}/200</p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gold text-background
                   font-display font-bold text-lg hover:bg-gold-light transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {step === 'submitting' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Locking in parameters…
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Lock In My Chapter
          </>
        )}
      </button>
    </div>
  )
}
