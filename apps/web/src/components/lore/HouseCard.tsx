import Link from 'next/link';
import type { House } from '@/content/lore';

interface HouseCardProps {
  house: House;
}

export function HouseCard({ house }: HouseCardProps) {
  return (
    <Link href={`/lore/houses/${house.id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
        {/* Color accent bar */}
        <div 
          className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-2"
          style={{ backgroundColor: house.color }}
        />
        
        {/* Icon & Title */}
        <div className="mb-4 flex items-start gap-3 pl-2">
          <span className="text-4xl">{house.icon}</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
              {house.name}
            </h3>
            <p className="text-sm text-muted-foreground">{house.title}</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground pl-2">
          {house.description}
        </p>
        
        {/* Strengths preview */}
        <div className="flex flex-wrap gap-2 pl-2">
          {house.strengths.slice(0, 2).map((strength, i) => (
            <span 
              key={i}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium"
            >
              {strength}
            </span>
          ))}
          {house.strengths.length > 2 && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              +{house.strengths.length - 2} more
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
