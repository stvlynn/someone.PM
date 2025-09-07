import React, { useEffect, useMemo, useRef, useState } from 'react'
import LogoLoop from '@/components/LogoLoop'
import './RejectedByPage.css'
import yaml from 'js-yaml'
import rejectedYaml from '@/data/rejected.yaml?raw'

type UiConfig = {
  titleTop?: number
  logoTop?: number
  width?: number | string
  logoHeight?: number
  speed?: number
  direction?: 'left' | 'right'
  gap?: number
  fadeOutColor?: string
  pauseOnHover?: boolean
  scaleOnHover?: boolean
  fadeOut?: boolean
  fitImageCard?: boolean
  cardPaddingX?: number
  cardPaddingY?: number
}

type LogoItem = { src: string; alt: string; href?: string }

interface RejectedConfig {
  title?: string
  ui?: UiConfig
  logos?: LogoItem[]
  schools?: {
    title?: string
    ui?: UiConfig
    logos?: LogoItem[]
  }
}

export default function RejectedByPage() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const cfg: RejectedConfig = useMemo(() => {
    try {
      const parsed = yaml.load(rejectedYaml) as unknown
      return (parsed && typeof parsed === 'object' ? (parsed as RejectedConfig) : {})
    } catch (e) {
      console.warn('Failed to parse rejected.yaml:', e)
      return {}
    }
  }, [])

  const title = cfg?.title ?? 'Rejected By'
  const ui = cfg?.ui ?? {}
  const titleTop = typeof ui.titleTop === 'number' ? ui.titleTop : 36
  const logoTop = typeof ui.logoTop === 'number' ? ui.logoTop : 50
  const width = ui.width ?? '100%'
  const logoHeight = typeof ui.logoHeight === 'number' ? ui.logoHeight : 48
  const speed = typeof ui.speed === 'number' ? ui.speed : 120
  const direction = (ui.direction === 'right' ? 'right' : 'left') as 'left' | 'right'
  const gap = typeof ui.gap === 'number' ? ui.gap : 40
  const fadeOutColor = ui.fadeOutColor ?? 'transparent'
  const pauseOnHover = ui.pauseOnHover ?? true
  const scaleOnHover = ui.scaleOnHover ?? true
  const fadeOut = ui.fadeOut ?? false
  const imageLogos: LogoItem[] = Array.isArray(cfg?.logos) ? (cfg?.logos as LogoItem[]) : []
  const schoolsUi = cfg?.schools?.ui ?? {}
  const schoolsLogos: LogoItem[] = Array.isArray(cfg?.schools?.logos) ? (cfg?.schools?.logos as LogoItem[]) : []

  // Trigger fireworks once when this section becomes visible
  useEffect(() => {
    if (!sectionRef.current) return
    let triggered = false
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          triggered = true
          setShowFireworks(true)
          setTimeout(() => setShowFireworks(false), 2000)
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="page-section rejected-page" id="rejected-by-section">
      <div className="rejected-container">
        {showFireworks && <FireworksOverlay />}
        {/* Title near upper-middle; same font/size/color as previous page */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `${titleTop}vh` }}>
          <h2 className="rejected-title">{title}</h2>
        </div>

        {/* Row 1: company logos */}
        <div
          style={{
            position: 'absolute',
            top: `${logoTop}vh`,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            height: '200px',
            overflow: 'hidden'
          }}
        >
          <LogoLoop
            logos={imageLogos}
            speed={speed}
            direction={direction}
            width={width}
            logoHeight={logoHeight}
            gap={gap}
            pauseOnHover={pauseOnHover}
            scaleOnHover={scaleOnHover}
            fadeOut={fadeOut}
            fadeOutColor={fadeOutColor}
            ariaLabel="Rejected by logos"
          />
        </div>

        {/* Row 2: schools logos below (no title) */}
        <div
          style={{
            position: 'absolute',
            top: `${schoolsUi.logoTop ?? 72}vh`,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            height: '200px',
            overflow: 'hidden'
          }}
        >
          {(() => {
            const schoolDirection = (schoolsUi.direction === 'left' || schoolsUi.direction === 'right')
              ? (schoolsUi.direction as 'left' | 'right')
              : 'right'
            return (
          <LogoLoop
            logos={schoolsLogos}
            speed={typeof schoolsUi.speed === 'number' ? schoolsUi.speed : speed}
            direction={schoolDirection}
            width={schoolsUi.width ?? width}
            logoHeight={typeof schoolsUi.logoHeight === 'number' ? schoolsUi.logoHeight : Math.max(40, logoHeight - 8)}
            gap={typeof schoolsUi.gap === 'number' ? schoolsUi.gap : Math.max(20, gap - 8)}
            pauseOnHover={schoolsUi.pauseOnHover ?? pauseOnHover}
            scaleOnHover={schoolsUi.scaleOnHover ?? scaleOnHover}
            fadeOut={schoolsUi.fadeOut ?? fadeOut}
            fadeOutColor={schoolsUi.fadeOutColor ?? fadeOutColor}
            fitImageCard={schoolsUi.fitImageCard ?? true}
            cardPaddingX={typeof schoolsUi.cardPaddingX === 'number' ? schoolsUi.cardPaddingX : 16}
            cardPaddingY={typeof schoolsUi.cardPaddingY === 'number' ? schoolsUi.cardPaddingY : 10}
            ariaLabel="Rejected schools logos"
          />
            )
          })()}
        </div>
      </div>
    </section>
  )
}

// Simple fireworks overlay for 2s bursts
function FireworksOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    let last = performance.now()
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; alpha: number; color: string; size: number }>
      = []

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width))
      canvas.height = Math.max(1, Math.floor(rect.height))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const colors = ['#ff6b6b', '#ffd93d', '#6bcBff', '#b16bff', '#66e0a3', '#ff9f43']

    const burst = () => {
      if (!running) return
      const cx = Math.random() * canvas.width
      const cy = Math.random() * canvas.height * 0.7 + canvas.height * 0.1
      const count = 24 + Math.floor(Math.random() * 20)
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2
        const speed = 1.2 + Math.random() * 2.2
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed
        particles.push({
          x: cx,
          y: cy,
          vx,
          vy,
          life: 900 + Math.random() * 600,
          alpha: 1,
          color: colors[(Math.random() * colors.length) | 0],
          size: 2 + Math.random() * 2.5,
        })
      }
    }

    // Create bursts for ~1.4s (leaving ~0.6s to fade)
    const burstTimer = setInterval(burst, 160)
    const stopTimer = setTimeout(() => {
      clearInterval(burstTimer)
    }, 1400)

    const tick = (t: number) => {
      const dt = Math.min(50, t - last)
      last = t
      // fade background
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(0,0,0,0)'
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // update + draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        // physics
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)
        p.vx *= 0.992
        p.vy = p.vy * 0.992 + 0.005 // tiny gravity
        p.life -= dt
        p.alpha = Math.max(0, p.life / 1200)

        // draw
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.life <= 0 || p.alpha <= 0) particles.splice(i, 1)
      }

      if (running) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      clearInterval(burstTimer)
      clearTimeout(stopTimer)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-40">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
