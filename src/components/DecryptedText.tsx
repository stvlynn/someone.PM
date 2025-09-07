import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AnimateOn = 'hover' | 'view' | 'load'
type RevealDirection = 'left' | 'right' | 'center'

export interface DecryptedTextProps {
  text: string
  speed?: number // ms per tick
  maxIterations?: number // overall ticks to complete
  characters?: string
  className?: string
  parentClassName?: string
  encryptedClassName?: string
  animateOn?: AnimateOn
  revealDirection?: RevealDirection
}

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?'

export default function DecryptedText({
  text,
  speed = 30,
  maxIterations = 20,
  characters = DEFAULT_CHARS,
  className,
  parentClassName,
  encryptedClassName = 'opacity-70',
  animateOn = 'hover',
  revealDirection = 'left',
}: DecryptedTextProps) {
  const [started, setStarted] = useState<boolean>(animateOn === 'load')
  const [revealed, setRevealed] = useState<number>(0)
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const chars = useMemo(() => text.split(''), [text])

  const order = useMemo(() => {
    const indices = chars.map((_, i) => i)
    if (revealDirection === 'right') return indices.reverse()
    if (revealDirection === 'center') {
      const result: number[] = []
      const mid = Math.floor(indices.length / 2)
      let left = mid - 1
      let right = mid
      while (left >= 0 || right < indices.length) {
        if (right < indices.length) result.push(right++)
        if (left >= 0) result.push(left--)
      }
      return result
    }
    return indices
  }, [chars, revealDirection])

  const step = Math.max(1, Math.floor(chars.length / Math.max(1, maxIterations)))

  const start = useCallback(() => {
    if (started) return
    setStarted(true)
  }, [started])

  // Viewport trigger
  useEffect(() => {
    if (animateOn !== 'view') return
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        start()
        obs.disconnect()
      }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [animateOn, start])

  // Animation loop
  useEffect(() => {
    if (!started) return
    const tick = () => {
      setRevealed((r) => Math.min(chars.length, r + step))
      timerRef.current = window.setTimeout(() => {
        rafRef.current = window.requestAnimationFrame(tick)
      }, speed) as unknown as number
    }
    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [started, chars.length, step, speed])

  // Compose current frame
  const content = useMemo(() => {
    if (!chars.length) return null
    const revealedSet = new Set(order.slice(0, revealed))
    return (
      <span className={parentClassName}>
        {chars.map((ch, i) => {
          const isWhitespace = ch === ' ' || ch === '\n' || ch === '\t'
          const showReal = isWhitespace || revealedSet.has(i)
          const display = showReal ? ch : characters[Math.floor(Math.random() * characters.length)] || ch
          return (
            <span key={i} className={showReal ? className : encryptedClassName}>
              {display === '\n' ? <br /> : display}
            </span>
          )
        })}
      </span>
    )
  }, [chars, order, revealed, characters, className, parentClassName, encryptedClassName])

  if (animateOn === 'hover') {
    return (
      <span ref={wrapRef} onMouseEnter={start}>
        {content}
      </span>
    )
  }
  return (
    <span ref={wrapRef}>
      {content}
    </span>
  )
}

