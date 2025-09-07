import React, { useMemo, useState } from 'react'
import yaml from 'js-yaml'
import photosYaml from '../../data/photos.yaml?raw'
import BlurText from '../../BlurText'
import { ParallaxScroll } from '@/components/ui/parallax-scroll'
import './AlbumPage.css'

interface AlbumPageProps {
  fifthSticky: boolean
  fifthProgress: number
  fifthRawProgress: number
  fifthSectionRef: React.RefObject<HTMLElement | null>
  fifthContainerRef: React.RefObject<HTMLDivElement | null>
}

type UiBase = { opacity?: number; translateY?: number; transition?: string }
type UiExit = { translateY?: number; transition?: string }
type UiScroll = { fadeOutStart?: number; fadeOutWindow?: number; moveOutPx?: number }
interface UiConfig { base?: UiBase; exit?: UiExit; scroll?: UiScroll }
interface PhotosDoc { ui?: { fifthRight?: UiConfig }; photos?: PhotoItem[] }
interface PhotoItem { name: string; location?: string; url: string }

export default function AlbumPage({
  fifthSticky,
  fifthProgress,
  fifthRawProgress,
  fifthSectionRef,
  fifthContainerRef,
}: AlbumPageProps) {
  const [showLine2, setShowLine2] = useState(false)

  const cfgAll: PhotosDoc = useMemo(() => {
    try {
      const parsed = yaml.load(photosYaml) as unknown
      return (parsed && typeof parsed === 'object' ? (parsed as PhotosDoc) : {})
    } catch (e) {
      console.warn('Failed to parse photos.yaml:', e)
      return {}
    }
  }, [])

  const uiConfig: UiConfig = cfgAll?.ui?.fifthRight || {}
  const photos: PhotoItem[] = Array.isArray(cfgAll?.photos) ? (cfgAll.photos as PhotoItem[]) : []

  const baseOpacity: number = uiConfig?.base?.opacity ?? 1
  const baseTranslateY: number = uiConfig?.base?.translateY ?? 0
  const baseTransition: string = uiConfig?.base?.transition ?? 'none'
  const exitTranslateY: number = uiConfig?.exit?.translateY ?? -48
  const exitTransition: string = uiConfig?.exit?.transition ?? 'opacity 0.6s ease-out, transform 0.6s ease-out'
  const fadeOutStart: number = uiConfig?.scroll?.fadeOutStart ?? 1.2
  const fadeOutWindow: number = uiConfig?.scroll?.fadeOutWindow ?? 0.25
  const moveOutPx: number = uiConfig?.scroll?.moveOutPx ?? 40

  const cards = photos.map((p) => ({ title: p.name, location: p.location, src: p.url }))

  return (
    <section ref={fifthSectionRef} className="page-section fifth-page" id="fifth-section">
      <div
        ref={fifthContainerRef}
        className={`fifth-container fifth-grid ${fifthSticky ? 'fifth-sticky' : ''}`}
        style={{
          opacity:
            fifthRawProgress <= 0
              ? Math.max(0, 1 + fifthRawProgress / 0.2)
              : fifthRawProgress <= 1.2
                ? 1
                : Math.max(0, 1 - (fifthRawProgress - 1.2) / 0.25),
          transform:
            fifthRawProgress <= 0
              ? `translateY(${Math.min(0.2, -fifthRawProgress) / 0.2 * 40}px)`
              : fifthRawProgress <= 1.2
                ? 'translateY(0px)'
                : `translateY(-${(fifthRawProgress - 1.2) / 0.25 * 40}px)`,
        }}
      >
        {/* Left: Sticky title (match fourth page style) */}
        <div 
          className="fifth-left sticky-left"
          style={{
            opacity: fifthProgress <= fadeOutStart ? 1 : Math.max(0, 1 - (fifthProgress - fadeOutStart) / fadeOutWindow),
            transform: fifthProgress <= fadeOutStart ? 'translateY(0px)' : `translateY(${exitTranslateY}px)`,
            transition: exitTransition,
          }}
        >
          <div>
            <BlurText
              text="Photo Album"
              className="fifth-title"
              animateBy="letters"
              delay={200}
              threshold={0.1}
              rootMargin="-100px"
              stepDuration={0.35}
              onAnimationComplete={() => setShowLine2(true)}
            />
            {showLine2 && (
              <BlurText
                text="Places and Moments"
                className="fifth-title"
                animateBy="letters"
                direction="top"
                delay={120}
                threshold={0.1}
                rootMargin="-100px"
                stepDuration={0.35}
              />
            )}
          </div>
        </div>

        {/* Right: Parallax scroll gallery */}
        <div
          className="fifth-right right-stage"
          style={{
            opacity: fifthProgress <= fadeOutStart ? baseOpacity : Math.max(0, baseOpacity - (fifthProgress - fadeOutStart) / fadeOutWindow),
            transform: fifthProgress <= fadeOutStart
              ? `translateY(${baseTranslateY}px)`
              : `translateY(${-(fifthProgress - fadeOutStart) / fadeOutWindow * moveOutPx + baseTranslateY}px)`,
            transition: baseTransition,
          }}
        >
          <ParallaxScroll items={cards} />
        </div>
      </div>
    </section>
  )
}
