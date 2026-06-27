'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  hue: number
}

export function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: (Math.random() - 0.5) * 0.8 - 0.2,
      opacity: Math.random() * 0.5 + 0.3,
      hue: Math.random() * 30 + 25,
    })

    const init = () => {
      resize()
      const count = Math.floor((canvas.width * canvas.height) / 6000)
      particles = Array.from({ length: Math.min(count, 100) }, createParticle)
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY

        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5)
        gradient.addColorStop(0, `hsla(${p.hue}, 85%, 80%, ${p.opacity})`)
        gradient.addColorStop(0.3, `hsla(${p.hue}, 80%, 75%, ${p.opacity * 0.5})`)
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 75%, 0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

    window.addEventListener('resize', init)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', init)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className='pointer-events-none fixed inset-0 -z-10'
    />
  )
}
