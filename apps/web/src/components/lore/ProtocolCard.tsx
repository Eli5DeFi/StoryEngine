import Link from 'next/link';
import type { Protocol } from '@/content/lore';

interface ProtocolCardProps {
  protocol: Protocol;
}

function getSpectrumBadgeColor(spectrum: string): string {
  switch (spectrum) {
    case 'HARD':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'SOFT':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'HYBRID':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function ProtocolCard({ protocol }: ProtocolCardProps) {
  return (
    <Link href={`/lore/protocols/${protocol.id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
        {/* Color accent bar */}
        <div 
          className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-2"
          style={{ backgroundColor: protocol.color }}
        />
        
        {/* Header */}
        <div className="mb-4 flex items-start gap-3 pl-2">
          <span className="text-4xl">{protocol.icon}</span>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {protocol.code}
              </span>
              <span 
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getSpectrumBadgeColor(protocol.spectrum)}`}
              >
                {protocol.spectrum}
              </span>
            </div>
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
              {protocol.name}
            </h3>
            <p className="text-sm text-muted-foreground">{protocol.shortDesc}</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground pl-2">
          {protocol.description}
        </p>
        
        {/* Strand types */}
        <div className="flex flex-wrap gap-2 pl-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
            {protocol.primaryStrand}
          </span>
          {protocol.secondaryStrand && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {protocol.secondaryStrand}
            </span>
          )}
        </div>
        
        {/* Hover indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-primary">View Details →</span>
        </div>
      </div>
    </Link>
  );
}
