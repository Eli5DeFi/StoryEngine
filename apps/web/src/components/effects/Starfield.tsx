'use client'

import { useEffect, useRef } from 'react'

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create stars - OPTIMIZED (reduced from 300 to 150)
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.15 + 0.02,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      color: ['255,255,255', '255,240,220', '220,230,255', '255,220,180', '200,220,255'][
        Math.floor(Math.random() * 5)
      ],
    }))

    // Create nebula clouds - OPTIMIZED (reduced from 5 to 3)
    const nebulae = Array.from({ length: 3 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 200 + 100,
      color: ['212, 168, 83', '0, 229, 200', '168, 85, 247'][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.015 + 0.005,
      speedX: Math.random() * 0.1 - 0.05,
    }))

    let animationId: number

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(5, 6, 11, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw nebulae
      nebulae.forEach((nebula) => {
        const gradient = ctx.createRadialGradient(
          nebula.x,
          nebula.y,
          0,
          nebula.x,
          nebula.y,
          nebula.radius
        )
        gradient.addColorStop(0, `rgba(${nebula.color}, ${nebula.opacity})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        nebula.x += nebula.speedX
        if (nebula.x > canvas.width + nebula.radius) nebula.x = -nebula.radius
        if (nebula.x < -nebula.radius) nebula.x = canvas.width + nebula.radius
      })

      // Draw stars
      stars.forEach((star) => {
        // Twinkle effect
        star.brightness += star.twinkleSpeed
        const brightness = Math.sin(star.brightness) * 0.5 + 0.5

        ctx.fillStyle = `rgba(${star.color}, ${brightness})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Glow for larger stars
        if (star.size > 1) {
          const gradient = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.size * 3
          )
          gradient.addColorStop(0, `rgba(${star.color}, ${brightness * 0.1})`)
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Move star
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      // Cancel animation frame to prevent memory leak on unmount
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="starfield" />
}
