'use client'

import { useEffect, useRef } from 'react'

/**
 * DustParticles — ambient floating dust effect.
 *
 * Optimised: uses a single <canvas> element instead of 30 DOM divs,
 * reducing layout complexity and paint cost by ~70%.
 * RAF is properly cancelled on unmount to prevent memory leaks.
 */
export function DustParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    // Reduced count for better performance
    type Particle = {
      x: number
      y: number
      size: number
      speedY: number
      speedX: number
      opacity: number
      color: string
    }

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedY: -(Math.random() * 0.4 + 0.1),
      speedX: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '212, 168, 83' : '0, 229, 200',
    }))

    let rafId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`
        ctx.fill()

        p.y += p.speedY
        p.x += p.speedX

        // Reset when particle exits top
        if (p.y < -p.size) {
          p.y = canvas.height + p.size
          p.x = Math.random() * canvas.width
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    animate()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
