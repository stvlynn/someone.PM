import React, { useEffect, useMemo, useRef, useState } from 'react'

interface SimpleCardsColumnProps {
  items: React.ReactNode[]
  width?: string
  viewportHeight?: number // optional fallback in px; measured from DOM if omitted
  itemMinHeight?: number
  itemGap?: number
  progress?: number // 0..1 typical; will be clamped
}

/**
 * A simple, progress-driven vertical track that reveals cards as the page scrolls.
 * - No nested scroll containers or event interception.
 * - Uses estimated item heights to compute translateY.
 */
export default function SimpleCardsColumn({
  items,
  width = '28rem',
  viewportHeight,
  itemMinHeight = 180,
  itemGap = 24,
  progress = 0,
}: SimpleCardsColumnProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)

  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current) {
        setMeasuredHeight(wrapperRef.current.clientHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const viewportEffective = measuredHeight ?? viewportHeight ?? 400

  const { trackHeight, maxScroll } = useMemo(() => {
    const n = items.length
    const track = n > 0 ? n * itemMinHeight + (n - 1) * itemGap : 0
    const max = Math.max(0, track - viewportEffective)
    return { trackHeight: track, maxScroll: max }
  }, [items.length, itemMinHeight, itemGap, viewportEffective])

  const clamped = Math.max(0, Math.min(1, progress))
  const translateY = -(clamped * maxScroll)

  return (
    <div
      ref={wrapperRef}
      className="cards-viewport"
      style={{
        width,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <div
        className="cards-track"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${trackHeight}px`,
          transform: `translateY(${translateY}px)`
        }}
      >
        {items.map((node, i) => (
          <div
            key={i}
            style={{
              minHeight: `${itemMinHeight}px`,
              marginTop: i === 0 ? 0 : `${itemGap}px`,
            }}
          >
            {node}
          </div>
        ))}
      </div>
    </div>
  )
}
