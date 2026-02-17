import { LeaderboardSkeleton } from '@/components/ui/skeleton'

export default function LeaderboardsLoading() {
  return (
    <div
      className="min-h-screen bg-background p-6"
      aria-label="Loading leaderboards…"
      aria-busy="true"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-10 w-56 animate-pulse rounded bg-void-800/50" />
        <LeaderboardSkeleton rows={10} />
      </div>
    </div>
  )
}
