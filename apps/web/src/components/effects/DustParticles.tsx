'use client'

import { useMemo } from 'react'

/**
 * Ambient dust particles for visual atmosphere.
 * useMemo ensures particle positions are stable across re-renders.
 * Particles are generated once per mount — no state updates needed.
 */
export function DustParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%`,
        animationDuration: `${10 + (i % 15)}s`,
        animationDelay: `${(i * 0.7) % 10}s`,
        xOffset: `${((i * 19) % 100) - 50}px`,
        color: i % 2 === 0 ? 'hsl(40, 80%, 60%)' : 'hsl(170, 100%, 45%)',
        size: `${1 + (i % 2)}px`,
        opacity: 0.1 + (i % 4) * 0.1,
      })),
    []
  )

  return (
    <div aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="dust-particle"
          style={{
            left: particle.left,
            bottom: '0',
            animation: `dustFloat ${particle.animationDuration} linear infinite`,
            animationDelay: particle.animationDelay,
            '--dust-x': particle.xOffset,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            zIndex: 1,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
