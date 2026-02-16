import Link from 'next/link'
import type { Protocol } from '@/types/lore'

interface DynamicProtocolCardProps {
  protocol: Protocol
}

const rarityColors = {
  COMMON: '#9ca3af',
  UNCOMMON: '#60a5fa',
  RARE: '#a78bfa',
  EPIC: '#f97316',
  LEGENDARY: '#eab308',
}

export function DynamicProtocolCard({ protocol }: DynamicProtocolCardProps) {
  const rarityColor = rarityColors[protocol.rarity] || rarityColors.COMMON

  return (
    <Link href={`/lore/protocols/${protocol.slug}`}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
        {/* House color accent */}
        <div
          className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-2"
          style={{ backgroundColor: protocol.house.primaryColor }}
        />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between pl-2">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="rounded bg-primary/10 px-2 py-1 font-mono text-xs font-bold"
                style={{ color: protocol.house.primaryColor }}
              >
                {protocol.code}
              </span>
              <span
                className="rounded bg-muted px-2 py-1 text-xs font-bold uppercase"
                style={{ color: rarityColor }}
              >
                {protocol.rarity}
              </span>
            </div>
            <h3 className="text-xl font-bold transition-colors group-hover:text-primary">
              {protocol.name}
            </h3>
          </div>
          {protocol.icon && <span className="text-2xl">{protocol.icon}</span>}
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 pl-2 text-sm text-muted-foreground">
          {protocol.description}
        </p>

        {/* House affiliation */}
        <div className="mb-4 flex items-center gap-2 pl-2">
          <span className="text-lg">{protocol.house.icon || '🏛️'}</span>
          <span className="text-sm font-medium">{protocol.house.name}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pl-2 text-xs">
          <div className="rounded bg-muted/50 p-2 text-center">
            <div className="text-muted-foreground">{protocol.strandType}</div>
            <div className="font-bold">Strand</div>
          </div>
          <div className="rounded bg-muted/50 p-2 text-center">
            <div className="text-muted-foreground">{protocol.powerLevel}/10</div>
            <div className="font-bold">Power</div>
          </div>
          <div className="rounded bg-muted/50 p-2 text-center">
            <div className="text-muted-foreground">{protocol.spectrum}</div>
            <div className="font-bold">Type</div>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs text-primary">View Details →</span>
        </div>
      </div>
    </Link>
  )
}
