import React, { useEffect, useMemo, useRef, useState } from 'react'

type NodeLogo = {
  node: React.ReactNode
  title?: string
  href?: string
}

type ImageLogo = {
  src: string
  alt: string
  href?: string
}

type LogoItem = NodeLogo | ImageLogo

interface LogoLoopProps {
  logos: LogoItem[]
  speed?: number // px per second; negative reverses direction
  direction?: 'left' | 'right'
  width?: number | string
  logoHeight?: number
  gap?: number
  pauseOnHover?: boolean
  fadeOut?: boolean
  fadeOutColor?: string
  scaleOnHover?: boolean
  ariaLabel?: string
  className?: string
  style?: React.CSSProperties
  fitImageCard?: boolean
  cardPaddingX?: number
  cardPaddingY?: number
}

const isImage = (l: LogoItem): l is ImageLogo => (l as any).src !== undefined

export default function LogoLoop({
  logos,
  speed = 120,
  direction = 'left',
  width = '100%',
  logoHeight = 28,
  gap = 32,
  pauseOnHover = true,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = 'Partner logos',
  className,
  style,
  fitImageCard = false,
  cardPaddingX = 12,
  cardPaddingY = 8,
}: LogoLoopProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [duration, setDuration] = useState(20)
  const [repeat, setRepeat] = useState(2) // even number of repeats
  const [imagesVersion, setImagesVersion] = useState(0)
  const [imgCardWidths, setImgCardWidths] = useState<Record<number, number>>({})

  // Duplicate list to create seamless loop
  const loopList = useMemo(() => Array.from({ length: Math.max(2, repeat) }, () => logos).flat(), [logos, repeat])

  useEffect(() => {
    if (!wrapperRef.current || !trackRef.current) return
    const wrapperW = wrapperRef.current.offsetWidth || 0
    const totalWidth = trackRef.current.scrollWidth || 0
    if (!totalWidth || !isFinite(totalWidth)) return
    const oneWidth = Math.max(1, totalWidth / Math.max(2, repeat))
    // Ensure at least half of track (distance) covers wrapper width
    const minRepeat = Math.max(2, 2 * Math.ceil(wrapperW / oneWidth))
    if (minRepeat > repeat && minRepeat <= 20) {
      setRepeat(minRepeat)
      return
    }
    // Animate across half of the track width
    const distance = (trackRef.current.scrollWidth || 0) / 2
    const pxPerSec = Math.max(1, Math.abs(speed))
    const d = Math.max(5, distance / pxPerSec)
    setDuration(d)
  }, [logos, speed, gap, logoHeight, width, repeat, imagesVersion])

  const effectiveDirection = (speed < 0)
    ? (direction === 'left' ? 'right' : 'left')
    : direction
  const animName = effectiveDirection === 'left' ? 'logo-loop-left' : 'logo-loop-right'

  return (
    <div
      ref={wrapperRef}
      aria-label={ariaLabel}
      className={[
        'relative h-full overflow-hidden',
        pauseOnHover ? 'group' : '',
        className || ''
      ].join(' ')}
      style={{ width, ...(style || {}) }}
    >
      {/* Gradient fade masks */}
      {fadeOut && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-24"
            style={{
              background: `linear-gradient(90deg, ${fadeOutColor ?? 'transparent'} 0%, transparent 100%)`
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-24"
            style={{
              background: `linear-gradient(270deg, ${fadeOutColor ?? 'transparent'} 0%, transparent 100%)`
            }}
          />
        </>
      )}

      <div
        ref={trackRef}
        className="absolute top-1/2 left-0 -translate-y-1/2 flex"
        style={{
          gap: `${gap}px`,
          animationName: animName,
          animationDuration: `${duration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: pauseOnHover ? 'running' as any : undefined
        }}
      >
        {loopList.map((logo, idx) => {
          const hoverClass = scaleOnHover ? 'transition-transform duration-200 group-hover:scale-105' : ''
          const innerFontSize = Math.round(logoHeight * 0.85)
          const isImg = isImage(logo)
          const origIndex = logos.length > 0 ? (idx % logos.length) : idx
          const imgEl = isImg ? (
            <img
              src={logo.src}
              alt={logo.alt}
              style={{ height: logoHeight, width: 'auto', display: 'block' }}
              onLoad={(e) => {
                const t = e.currentTarget as HTMLImageElement
                let nw = t.naturalWidth || 0
                let nh = t.naturalHeight || 0
                if (!nw || !nh) {
                  const rect = t.getBoundingClientRect()
                  nw = rect.width || nw
                  nh = rect.height || nh
                }
                const ratio = nw && nh ? nw / nh : 1
                const cardW = Math.round(ratio * logoHeight + cardPaddingX * 2)
                setImgCardWidths((prev) => (prev[origIndex] === cardW ? prev : { ...prev, [origIndex]: cardW }))
                setImagesVersion((v) => v + 1)
              }}
            />
          ) : null

          const nodeEl = !isImg ? (
            <div title={(logo as any).title} style={{ fontSize: innerFontSize }}>
              {(logo as any).node}
            </div>
          ) : null

          const squareSize = Math.round(logoHeight + Math.max(12, logoHeight * 0.35))
          const cardHeight = logoHeight + cardPaddingY * 2
          const dynamicWidth = imgCardWidths[origIndex]
          const cellStyle = fitImageCard && isImg
            ? { padding: `${cardPaddingY}px ${cardPaddingX}px`, height: cardHeight, width: dynamicWidth ?? (logoHeight + cardPaddingX * 2) }
            : { width: squareSize, height: squareSize }

          const cell = (
            <div
              className={`inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${hoverClass}`}
              style={cellStyle as React.CSSProperties}
            >
              {imgEl || nodeEl}
            </div>
          )
          return (logo as any).href ? (
            <a key={idx} href={(logo as any).href} target="_blank" rel="noreferrer" className="inline-flex items-center">
              {cell}
            </a>
          ) : (
            <div key={idx} className="inline-flex items-center">
              {cell}
            </div>
          )
        })}
      </div>

      {/* Keyframes */}
      <style>
        {`
        @keyframes logo-loop-left {
          0% { transform: translate3d(0, -50%, 0); }
          100% { transform: translate3d(-50%, -50%, 0); }
        }
        @keyframes logo-loop-right {
          0% { transform: translate3d(-50%, -50%, 0); }
          100% { transform: translate3d(0, -50%, 0); }
        }
        .group:hover [style*='animation-name'] {
          animation-play-state: paused !important;
        }
      `}
      </style>
    </div>
  )
}
