'use client'

import { useEffect, useState } from 'react'

export function DustParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number
    left: string
    animationDuration: string
    animationDelay: string
    xOffset: string
    color: string
    size: string
  }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 15 + 10}s`,
      animationDelay: `${Math.random() * 10}s`,
      xOffset: `${Math.random() * 100 - 50}px`,
      color: Math.random() > 0.5 ? 'hsl(40, 80%, 60%)' : 'hsl(170, 100%, 45%)',
      size: `${Math.random() * 2 + 1}px`,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <>
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
            opacity: Math.random() * 0.4 + 0.1,
            zIndex: 1,
          } as React.CSSProperties}
        />
      ))}
    </>
  )
}
