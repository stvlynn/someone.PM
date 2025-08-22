import React from 'react'
import { EvervaultCard } from '../ui/evervault-card'
import stvWhite from '../../assets/stv-white.png'
import './ContentPage.css'

interface ContentPageProps {
  scrollProgress: number
  isContentSticky: boolean
  isImageHovered: boolean
  contentContainerRef: React.RefObject<HTMLDivElement | null>
  textContentRef: React.RefObject<HTMLDivElement | null>
  setIsImageHovered: (hovered: boolean) => void
}

export default function ContentPage({
  scrollProgress,
  isContentSticky,
  isImageHovered,
  contentContainerRef,
  textContentRef,
  setIsImageHovered
}: ContentPageProps) {

  return (
    <section className="page-section content-page" id="content-section">
      <div ref={contentContainerRef} className={`content-container ${isContentSticky ? 'sticky-content' : ''}`}>
        <div
          className="image-content relative z-30"
          style={{
            // Entrance: fade + upward translate (0.05 -> 0.4), Exit: fade + upward translate (1.0 -> 1.2)
            opacity: scrollProgress <= 1.2 
              ? Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35))
              : Math.max(0, 1 - (scrollProgress - 1.2) / 0.25),
            transform: scrollProgress <= 1.2
              ? `translateY(${(1 - Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35))) * 40}px)`
              : `translateY(-${(scrollProgress - 1.2) / 0.25 * 40}px)`
          }}
        >
          <div className="flex flex-col items-center max-w-sm mx-auto relative h-[30rem]">
            <EvervaultCard>
              <img 
                src={stvWhite} 
                alt="STV Logo" 
                className="w-full h-full object-cover" 
                onMouseEnter={() => setIsImageHovered(true)}
                onMouseLeave={() => setIsImageHovered(false)}
              />
            </EvervaultCard>
          </div>
        </div>
        <div
          ref={textContentRef}
          className={`text-content transition-all duration-300 ${isImageHovered ? 'blur-sm' : ''}`}
          style={{
            // Exit mirrors entrance but waits until after leeway then moves upward while fading out
            opacity: scrollProgress <= 1.2 
              ? 1
              : Math.max(0, 1 - (scrollProgress - 1.2) / 0.25),
            transform: scrollProgress <= 1.2
              ? 'translateY(0px)'
              : `translateY(-${(scrollProgress - 1.2) / 0.25 * 40}px)`,
          }}
        >
          {(() => {
            const phrase = 'Build Value Together With AI'
            const words = phrase.split(' ')
            const totalLetters = phrase.replace(/\s+/g, '').length
            // Progress -> number of revealed letters (spaces excluded)
            // Entrance: 0.05 -> 0.95, Exit: keep fully visible while parent moves up/fades
            const textProgress = scrollProgress <= 1.2 
              ? Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.9))
              : 1
            const visibleCount = Math.floor(textProgress * totalLetters)

            let offset = 0 // running index across letters
            return (
              <div aria-label={phrase}>
                {words.map((word, wIdx) => {
                  const start = offset
                  offset += word.length
                  return (
                    <div className="word-line" key={wIdx}>
                      {Array.from(word).map((ch, i) => {
                        const globalIndex = start + i
                        const isVisible = globalIndex < visibleCount
                        return (
                          <span
                            key={i}
                            className={`character ${isVisible ? 'animate-in' : ''}`}
                          >
                            {ch}
                          </span>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )
}