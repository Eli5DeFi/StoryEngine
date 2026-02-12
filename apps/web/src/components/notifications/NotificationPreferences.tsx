'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Mail,
  Smartphone,
  Trophy,
  TrendingUp,
  Users,
  Clock,
  Save,
  Loader2,
} from 'lucide-react'
import {
  useNotificationPreferences,
  type NotificationPreferences as Prefs,
} from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'

export function NotificationPreferences() {
  const {
    preferences,
    loading,
    error,
    updatePreferences,
  } = useNotificationPreferences()

  const [localPrefs, setLocalPrefs] = useState<Partial<Prefs>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Initialize local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences)
    }
  }, [preferences])

  const handleToggle = (key: keyof Prefs) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      await updatePreferences(localPrefs)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !preferences) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-6 border border-red-500/30">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 border border-void-800"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-gold" />
        <h2 className="text-2xl font-bold text-foreground">
          Notification Preferences
        </h2>
      </div>

      {/* Delivery Channels */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Delivery Channels
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={<Bell className="w-5 h-5" />}
            label="In-App Notifications"
            description="Show notifications within the app"
            checked={localPrefs.inAppEnabled ?? true}
            onChange={() => handleToggle('inAppEnabled')}
          />
          <PreferenceToggle
            icon={<Smartphone className="w-5 h-5" />}
            label="Push Notifications"
            description="Receive browser push notifications"
            checked={localPrefs.pushEnabled ?? true}
            onChange={() => handleToggle('pushEnabled')}
          />
          <PreferenceToggle
            icon={<Mail className="w-5 h-5" />}
            label="Email Notifications"
            description="Receive notifications via email"
            checked={localPrefs.emailEnabled ?? true}
            onChange={() => handleToggle('emailEnabled')}
          />
        </div>
      </div>

      {/* Notification Types */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Notification Types
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={<Bell className="w-5 h-5" />}
            label="Chapter Releases"
            description="New chapters in stories you're following"
            checked={localPrefs.chapterReleases ?? true}
            onChange={() => handleToggle('chapterReleases')}
          />
          <PreferenceToggle
            icon={<Trophy className="w-5 h-5" />}
            label="Bet Outcomes"
            description="When your bets win or lose"
            checked={localPrefs.betOutcomes ?? true}
            onChange={() => handleToggle('betOutcomes')}
          />
          <PreferenceToggle
            icon={<TrendingUp className="w-5 h-5" />}
            label="Streak Milestones"
            description="When you reach win streak milestones"
            checked={localPrefs.streaks ?? true}
            onChange={() => handleToggle('streaks')}
          />
          <PreferenceToggle
            icon={<Users className="w-5 h-5" />}
            label="Leaderboard Updates"
            description="Changes in your leaderboard position"
            checked={localPrefs.leaderboard ?? false}
            onChange={() => handleToggle('leaderboard')}
          />
          <PreferenceToggle
            icon={<Users className="w-5 h-5" />}
            label="Friend Activity"
            description="When friends make bets or win"
            checked={localPrefs.friendActivity ?? true}
            onChange={() => handleToggle('friendActivity')}
          />
          <PreferenceToggle
            icon={<Clock className="w-5 h-5" />}
            label="Pool Closing Soon"
            description="Alerts when betting pools are about to close"
            checked={localPrefs.poolClosing ?? true}
            onChange={() => handleToggle('poolClosing')}
          />
          <PreferenceToggle
            icon={<Mail className="w-5 h-5" />}
            label="Weekly Digest"
            description="Weekly summary of your performance"
            checked={localPrefs.weeklyDigest ?? true}
            onChange={() => handleToggle('weeklyDigest')}
          />
          <PreferenceToggle
            icon={<Bell className="w-5 h-5" />}
            label="System Announcements"
            description="Important platform updates"
            checked={localPrefs.system ?? true}
            onChange={() => handleToggle('system')}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </Button>

        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-green-400"
          >
            ✓ Saved successfully
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

interface PreferenceToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function PreferenceToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-void-900/30 border border-void-800 hover:border-void-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-foreground/70 mt-1">{icon}</div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {label}
          </h4>
          <p className="text-xs text-foreground/60">{description}</p>
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-gold' : 'bg-void-700'
        }`}
      >
        <motion.div
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
          animate={{
            x: checked ? 24 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
      </button>
    </div>
  )
}
