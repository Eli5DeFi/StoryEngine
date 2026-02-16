import Link from 'next/link'
import type { House } from '@/types/lore'

interface DynamicHouseCardProps {
  house: House
}

export function DynamicHouseCard({ house }: DynamicHouseCardProps) {
  return (
    <Link href={`/lore/houses/${house.slug}`}>
      <div 
        className="group relative overflow-hidden rounded-[14px] p-6 transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${house.primaryColor}40`,
          boxShadow: `0 0 20px ${house.primaryColor}20`,
        }}
      >
        {/* Accent Glow on Hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${house.primaryColor}15, transparent 70%)`,
          }}
        />

        {/* Color Accent Bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 transition-all duration-200 group-hover:w-2"
          style={{ backgroundColor: house.primaryColor }}
        />

        {/* Icon & Title */}
        <div className="relative mb-4 flex items-start gap-3 pl-2">
          <span className="text-4xl filter drop-shadow-lg">{house.icon || '🏛️'}</span>
          <div className="flex-1">
            <h3 className="text-xl font-display font-bold text-[#F1F5F9] transition-colors group-hover:text-[#E2E8F0]">
              {house.name}
            </h3>
            <p 
              className="text-[10px] uppercase tracking-[2px] text-[#64748B] mt-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {house.strandType}-Strand · {house.territory || 'Unknown Territory'}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="relative mb-4 pl-2 text-sm text-[#94A3B8] leading-relaxed line-clamp-3">
          {house.description}
        </p>

        {/* Stats Grid - Glassmorphism Cards */}
        <div className="relative mb-4 grid grid-cols-2 gap-2 pl-2">
          <StatCard 
            label="Members" 
            value={house.memberCount.toLocaleString()} 
            color={house.primaryColor}
          />
          <StatCard 
            label="Protocols" 
            value={house.protocolCount.toString()} 
            color={house.primaryColor}
          />
          <StatCard 
            label="Influence" 
            value={`${house.influence}/1000`} 
            color={house.primaryColor}
          />
          <StatCard 
            label="Win Rate" 
            value={`${house.winRate.toFixed(1)}%`} 
            color={house.primaryColor}
          />
        </div>

        {/* Top Protocols Preview */}
        {house.protocols && house.protocols.length > 0 && (
          <div className="relative flex flex-wrap gap-2 pl-2">
            {house.protocols.slice(0, 2).map((protocol) => (
              <span
                key={protocol.id}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background: `${house.primaryColor}20`,
                  color: house.primaryColor,
                  border: `1px solid ${house.primaryColor}40`,
                }}
              >
                {protocol.code}
              </span>
            ))}
            {house.protocols.length > 2 && (
              <span 
                className="rounded-full px-3 py-1 text-xs text-[#64748B]"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(100, 116, 139, 0.2)',
                }}
              >
                +{house.protocols.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Hover Indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span 
            className="text-xs font-medium"
            style={{ 
              color: house.primaryColor,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
            }}
          >
            VIEW DETAILS →
          </span>
        </div>
      </div>
    </Link>
  )
}

interface StatCardProps {
  label: string
  value: string
  color: string
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div 
      className="rounded-lg p-2 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        border: `1px solid ${color}20`,
      }}
    >
      <div 
        className="text-[9px] uppercase tracking-[2px] text-[#64748B] mb-1"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
      <div className="font-display font-bold text-[#F1F5F9] tabular-nums">
        {value}
      </div>
    </div>
  )
}
