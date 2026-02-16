import Link from 'next/link'
import type { House } from '@/types/lore'

interface DynamicHouseCardProps {
  house: House
}

export function DynamicHouseCard({ house }: DynamicHouseCardProps) {
  return (
    <Link href={`/lore/houses/${house.slug}`}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
        {/* Color accent bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-2"
          style={{ backgroundColor: house.primaryColor }}
        />

        {/* Icon & Title */}
        <div className="mb-4 flex items-start gap-3 pl-2">
          <span className="text-4xl">{house.icon || '🏛️'}</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold transition-colors group-hover:text-primary">
              {house.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {house.strandType}-Strand: {house.territory || 'Unknown Territory'}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-3 pl-2 text-sm text-muted-foreground">
          {house.description}
        </p>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 pl-2 text-xs">
          <div className="rounded bg-muted/50 p-2">
            <div className="text-muted-foreground">Members</div>
            <div className="font-bold">{house.memberCount.toLocaleString()}</div>
          </div>
          <div className="rounded bg-muted/50 p-2">
            <div className="text-muted-foreground">Protocols</div>
            <div className="font-bold">{house.protocolCount}</div>
          </div>
          <div className="rounded bg-muted/50 p-2">
            <div className="text-muted-foreground">Influence</div>
            <div className="font-bold">{house.influence}/1000</div>
          </div>
          <div className="rounded bg-muted/50 p-2">
            <div className="text-muted-foreground">Win Rate</div>
            <div className="font-bold">{house.winRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Top Protocols preview */}
        {house.protocols && house.protocols.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-2">
            {house.protocols.slice(0, 2).map((protocol) => (
              <span
                key={protocol.id}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {protocol.code}
              </span>
            ))}
            {house.protocols.length > 2 && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                +{house.protocols.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Hover indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs text-primary">View Details →</span>
        </div>
      </div>
    </Link>
  )
}
