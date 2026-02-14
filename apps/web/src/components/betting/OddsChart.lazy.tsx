/**
 * Lazy-loaded OddsChart component
 * Reduces initial bundle size by ~150KB
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

export const OddsChart = dynamic(
  () => import('./OddsChart').then(mod => ({ default: mod.OddsChart })),
  {
    loading: () => (
      <div className="w-full h-80">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    ),
    ssr: false,
  }
)
