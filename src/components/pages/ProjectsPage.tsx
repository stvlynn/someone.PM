import React, { useMemo, useState } from 'react'
import yaml from 'js-yaml'
// Vite supports importing file contents as raw strings via ?raw
import projectsYaml from '../../data/projects.yaml?raw'
import BlurText from '../../BlurText'
import InfiniteScroll from '../InfiniteScroll'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import './ProjectsPage.css'

interface ProjectsPageProps {
  fourthSticky: boolean
  fourthProgress: number
  fourthRawProgress: number
  fourthSectionRef: React.RefObject<HTMLElement | null>
  fourthContainerRef: React.RefObject<HTMLDivElement | null>
}

export default function ProjectsPage({
  fourthSticky,
  fourthProgress,
  fourthRawProgress,
  fourthSectionRef,
  fourthContainerRef
}: ProjectsPageProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [showLine2, setShowLine2] = useState(false)
  
  // Parse YAML once (ui config + projects list)
  const cfgAll = useMemo(() => {
    try {
      return yaml.load(projectsYaml) as any
    } catch (e) {
      console.warn('Failed to parse projects.yaml:', e)
      return {} as any
    }
  }, [])

  const uiConfig = cfgAll?.ui?.fourthRight || {}
  const uiCards = cfgAll?.ui?.cards || {}
  const projects = (cfgAll?.projects || []) as Array<{
    name: string
    description?: string
    image?: string
    url?: string
    tech?: string[]
  }>

  const baseOpacity: number = uiConfig?.base?.opacity ?? 1
  const baseTranslateY: number = uiConfig?.base?.translateY ?? 0
  const baseTransition: string = uiConfig?.base?.transition ?? 'none'
  const itemMinHeightFromConfig: number = uiCards?.itemMinHeight ?? 180
  const itemGapDerived: number = Math.round(itemMinHeightFromConfig / 4)
  const itemGapUsed: number = itemGapDerived
  const exitTranslateY: number = uiConfig?.exit?.translateY ?? -(itemGapUsed * 3) // default -3×gap
  const exitTransition: string = uiConfig?.exit?.transition ?? 'opacity 0.6s ease-out, transform 0.6s ease-out'
  const fadeOutStart: number = uiConfig?.scroll?.fadeOutStart ?? 1.2
  const fadeOutWindow: number = uiConfig?.scroll?.fadeOutWindow ?? 0.25
  const moveOutPx: number = uiConfig?.scroll?.moveOutPx ?? 40
  
  const handleAnimationComplete = () => {
    console.log('All letters have animated!')
  }

  const leftTextLine1 = 'Vibe Coding'
  const leftTextLine2 = 'for Technology Equity'

  const items = projects.map((p, idx) => ({
    content: (
      <a
        key={idx}
        className="proj-card relative block overflow-hidden hover:bg-white/10 transition-colors"
        href={p.url}
        target="_blank"
        rel="noreferrer"
      >
        {/* Glow border on mouse proximity (same as homepage send button) */}
        <GlowingEffect
          variant="white"
          glow={true}
          disabled={false}
          proximity={64}
          spread={40}
          inactiveZone={0.01}
          borderWidth={1}
          className="z-0"
        />
        <div className="relative z-10">
          {p.image && (
            <div className="w-full h-28 overflow-hidden rounded-t-2xl bg-black/20">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-3">
            <div className="text-base font-semibold">{p.name}</div>
            {p.description && <div className="mt-1 text-sm opacity-80 line-clamp-3">{p.description}</div>}
            {p.tech && p.tech.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 text-xs opacity-80">
                {p.tech.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-white/10">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </a>
    )
  }))

  return (
    <section ref={fourthSectionRef} className="page-section fourth-page" id="fourth-section">
      <div
        ref={fourthContainerRef}
        className={`fourth-container fourth-grid ${fourthSticky ? 'fourth-sticky' : ''}`}
        style={{
          // Reverse scroll flip near page 3 top, and exit when > 1.2 same as others
          opacity:
            fourthRawProgress <= 0
              ? Math.max(0, 1 + fourthRawProgress / 0.2)
              : fourthRawProgress <= 1.2
                ? 1
                : Math.max(0, 1 - (fourthRawProgress - 1.2) / 0.25),
          transform:
            fourthRawProgress <= 0
              ? `translateY(${Math.min(0.2, -fourthRawProgress) / 0.2 * 40}px)`
              : fourthRawProgress <= 1.2
                ? 'translateY(0px)'
                : `translateY(-${(fourthRawProgress - 1.2) / 0.25 * 40}px)`,
        }}
      >
        {/* Left: Sticky intro text with same animation behavior as NamePage left */}
        <div 
          className="fourth-left sticky-left"
          style={{
            opacity: isExiting ? 0 : 1,
            transform: isExiting ? 'translateY(-30px)' : 'translateY(0px)',
            transition: isExiting ? 'opacity 0.5s ease-out, transform 0.5s ease-out' : 'none'
          }}
        >
          <div>
            <BlurText
              text={leftTextLine1}
              className="fourth-title"
              animateBy="letters"
              delay={200}
              threshold={0.1}
              rootMargin="-100px"
              stepDuration={0.35}
              onAnimationComplete={() => setShowLine2(true)}
            />
            {showLine2 && (
              <BlurText
                text={leftTextLine2}
                className="fourth-title"
                animateBy="letters"
                direction="top"
                delay={120}
                threshold={0.1}
                rootMargin="-100px"
                stepDuration={0.35}
                onAnimationComplete={handleAnimationComplete}
              />
            )}
          </div>
        </div>

        {/* Right: Infinite Scroll cards */}
        <div
          className="fourth-right right-stage"
          style={{
            opacity: isExiting ? 0 : (fourthProgress <= fadeOutStart ? baseOpacity : Math.max(0, baseOpacity - (fourthProgress - fadeOutStart) / fadeOutWindow)),
            transform: isExiting
              ? `translateY(${exitTranslateY}px)`
              : (fourthProgress <= fadeOutStart
                ? `translateY(${baseTranslateY}px)`
                : `translateY(${-(fourthProgress - fadeOutStart) / fadeOutWindow * moveOutPx + baseTranslateY}px)`),
            transition: isExiting ? exitTransition : baseTransition,
          }}
        >
          <InfiniteScroll
            width="28rem"
            maxHeight="28rem"
            negativeMargin="0px"
            itemMinHeight={itemMinHeightFromConfig}
            itemGap={itemGapUsed}
            isTilted={false}
            tiltDirection="right"
            listenTarget={fourthSectionRef.current as HTMLElement | null}
            loop={false}
            onBoundaryReached={(boundary) => {
              console.log(`Reached ${boundary} boundary - trigger exit effect`);
              setIsExiting(true);
              // Reset after animation duration
              setTimeout(() => setIsExiting(false), 800);
            }}
            items={items}
          />
        </div>
      </div>
    </section>
  )
}
