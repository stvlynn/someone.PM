import React from 'react'
import BlurText from '../../BlurText'
import FallingText from '../FallingText'
import './NamePage.css'

interface NamePageProps {
  thirdSticky: boolean
  thirdProgress: number
  thirdRawProgress: number
  thirdSectionRef: React.RefObject<HTMLElement | null>
  thirdContainerRef: React.RefObject<HTMLDivElement | null>
}

export default function NamePage({
  thirdSticky,
  thirdProgress,
  thirdRawProgress,
  thirdSectionRef,
  thirdContainerRef
}: NamePageProps) {
  const handleAnimationComplete = () => {
    console.log('All letters have animated!')
  }

  return (
    <section ref={thirdSectionRef} className="page-section third-page" id="third-section">
      <div
        ref={thirdContainerRef}
        className={`third-container third-grid ${thirdSticky ? 'third-sticky' : ''}`}
        style={{
          // Flip effect: when reverse scrolling upward into page 2, slide down and fade;
          // when continuing downward past fully visible, slide up and fade (same as page 2)
          opacity:
            thirdRawProgress <= 0
              ? Math.max(0, 1 + thirdRawProgress / 0.2) // from 1 -> 0 as raw goes 0 -> -0.2
              : thirdRawProgress <= 1.2
                ? 1
                : Math.max(0, 1 - (thirdRawProgress - 1.2) / 0.25),
          transform:
            thirdRawProgress <= 0
              ? `translateY(${Math.min(0.2, -thirdRawProgress) / 0.2 * 40}px)` // slide down up to 40px
              : thirdRawProgress <= 1.2
                ? 'translateY(0px)'
                : `translateY(-${(thirdRawProgress - 1.2) / 0.25 * 40}px)`,
        }}
      >
        {/* Left: Sticky intro */}
        <div className="third-left sticky-left">
          <BlurText
            text="Hi!👋 I am..."
            className="third-title"
            animateBy="letters"
            direction="top"
            delay={100}
            threshold={0.1}
            rootMargin="-100px"
            stepDuration={0.35}
            onAnimationComplete={handleAnimationComplete}
          />
        </div>

        {/* Right: Name base under hover overlay */}
        <div
          className="third-right right-stage"
          style={{
            // Match second page: begin exit after 1.2 with same easing window
            opacity: thirdProgress <= 1.2 ? 1 : Math.max(0, 1 - (thirdProgress - 1.2) / 0.25),
            transform: thirdProgress <= 1.2 ? 'translateY(0px)' : `translateY(-${(thirdProgress - 1.2) / 0.25 * 40}px)`
          }}
        >
          <div className="right-name third-title z-10">Steven Lynn</div>
          <div className="right-hover absolute inset-0 z-20 flex items-center justify-center">
            <FallingText
              text="AI Explorer vibe coder Photographer INTP Product Design Think Different"
              trigger="hover"
              fontSize="2.5rem"
              opacity={0.35}
              spacing={18}
            />
          </div>
        </div>
      </div>
    </section>
  )
}