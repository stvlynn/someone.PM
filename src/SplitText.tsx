import React, { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'

export type SplitType = 'chars' | 'words' | 'lines'

type VectorProps = Record<string, any>

interface SplitTextProps {
  text: string
  className?: string
  delay?: number // ms
  duration?: number // seconds per letter
  ease?: string
  splitType?: SplitType
  from?: VectorProps
  to?: VectorProps
  threshold?: number | number[]
  rootMargin?: string
  textAlign?: 'left' | 'center' | 'right'
  onLetterAnimationComplete?: () => void
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className,
  delay = 0,
  duration = 0.5,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  textAlign = 'left',
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<HTMLSpanElement[]>([])
  const animationCompletedRef = useRef(false)

  // Prepare split arrays
  const parts = useMemo(() => {
    if (splitType === 'words') return text.split(/(\s+)/)
    if (splitType === 'lines') return text.split(/\n/)
    return Array.from(text)
  }, [text, splitType])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const targets = lettersRef.current.filter(Boolean)

    // If animation already completed once, ensure final state and skip
    if (animationCompletedRef.current) {
      if (targets.length) {
        gsap.set(targets, { ...to, clearProps: 'willChange' })
      }
      return
    }

    // Reset state before animating
    targets.forEach((span) => {
      if (!span) return
      ;(span as HTMLElement).style.willChange = 'transform, opacity'
      Object.assign(span.style, {
        opacity: from.opacity ?? '',
        transform: '',
      })
    })

    // Observer to trigger when entering viewport (once)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationCompletedRef.current) {
            if (targets.length === 0) return

            gsap.killTweensOf(targets)

            gsap.fromTo(
              targets,
              { ...from },
              {
                ...to,
                duration,
                ease,
                stagger: 0.03,
                delay: (delay || 0) / 1000,
                onComplete: () => {
                  animationCompletedRef.current = true
                  gsap.set(targets, { ...to, clearProps: 'willChange' })
                  onLetterAnimationComplete?.()
                },
              }
            )

            // Only animate once
            io.disconnect()
          }
        })
      },
      { threshold, rootMargin }
    )

    io.observe(el)

    return () => {
      io.disconnect()
      gsap.killTweensOf(lettersRef.current)
    }
  }, [delay, duration, ease, from, to, threshold, rootMargin, onLetterAnimationComplete])

  return (
    <div ref={containerRef} className={className} style={{ textAlign }}>
      {parts.map((part, idx) => {
        // Preserve spaces when splitting by words
        const isSpace = part.match(/^\s+$/)
        if (splitType === 'words') {
          if (isSpace) {
            return <span key={idx} aria-hidden="true">{part}</span>
          }
          // Wrap each word in a span and further split into letters
          const letters = Array.from(part)
          return (
            <span key={idx} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
              {letters.map((ch, i) => (
                <span
                  key={`${idx}-${i}`}
                  ref={(el) => {
                    if (el) lettersRef.current.push(el)
                  }}
                  style={{ display: 'inline-block' }}
                >
                  {ch}
                </span>
              ))}
            </span>
          )
        }

        if (splitType === 'lines') {
          return (
            <span key={idx} style={{ display: 'block', whiteSpace: 'pre' }}>
              {Array.from(part).map((ch, i) => (
                <span
                  key={`${idx}-${i}`}
                  ref={(el) => {
                    if (el) lettersRef.current.push(el)
                  }}
                  style={{ display: 'inline-block' }}
                >
                  {ch}
                </span>
              ))}
            </span>
          )
        }

        // Default 'chars'
        return (
          <span
            key={idx}
            ref={(el) => {
              if (el) lettersRef.current.push(el)
            }}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >
            {part}
          </span>
        )
      })}
    </div>
  )
}

export default SplitText
