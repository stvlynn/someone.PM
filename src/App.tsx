import { useState, useEffect, useRef } from 'react'
import './App.css'
import Dither from './components/Dither'
import SearchInterface from './components/SearchInterface'
import { EvervaultCard } from './components/ui/evervault-card'
import { TracingBeam } from './components/ui/tracing-beam'
import BlurText from './BlurText'
import FallingText from './components/FallingText'
import stvWhite from './assets/stv-white.png'

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isImageHovered, setIsImageHovered] = useState(false)
  const [isContentSticky, setIsContentSticky] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0) // 0..1 progress for second section
  const textContentRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const handleAnimationComplete = () => {
    console.log('All letters have animated!')
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll-based text animation and sticky positioning
  useEffect(() => {
    const handleScroll = () => {
      if (!textContentRef.current || !contentContainerRef.current) return

      const windowHeight = window.innerHeight

      // Only activate sticky when scrolled past first screen and until after text is fully revealed with leeway
      const scrollY = window.scrollY
      const pastFirstScreen = scrollY > windowHeight * 0.5
      // Calculate raw progress for sticky logic and extended progress for exit animation
      const rawProgress = (scrollY - windowHeight) / (windowHeight * 1.5)
      
      // Extended progress for exit animation (continues beyond 1.0)
      const extendedProgress = Math.max(0, rawProgress)
      setScrollProgress(extendedProgress)

      // Add a release leeway so sticky remains a bit longer after fully revealed
      const releaseThreshold = 1.2
      const shouldBeSticky = pastFirstScreen && rawProgress < releaseThreshold
      setIsContentSticky(shouldBeSticky)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Global Dither Background */}
      <div className={`fixed inset-0 z-0 transition-all duration-300 ${
        isImageHovered ? 'blur-sm' : ''
      }`}>
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>
      
      {/* Global Cursor Dot */}
      <div 
        className="cursor-dot"
        style={{
          left: mousePosition.x,
          top: mousePosition.y
        }}
      />

      {/* Background dark overlay when image is hovered */}
      <div className={`fixed inset-0 bg-black/20 pointer-events-none transition-opacity duration-300 z-20 ${
        isImageHovered ? 'opacity-100' : 'opacity-0'
      }`} />


      {/* First Page - Search Interface */}
      <section className={`page-section search-page transition-all duration-300 ${
        isImageHovered ? 'blur-sm' : ''
      }`}>
        <SearchInterface />
      </section>



      {/* Second Page - Animated Content with left progress beam */}
      <section className="page-section content-page" id="content-section">
        <TracingBeam className="px-6">
        <div ref={contentContainerRef} className={`content-container ${isContentSticky ? 'sticky-content' : ''}`}>
          <div
            className="image-content relative z-30"
            style={{
              // Entrance: fade + upward translate (0.05 -> 0.4), Exit: fade + upward translate (1.0 -> 1.2)
              opacity: scrollProgress <= 1.0 
                ? Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35))
                : Math.max(0, 1 - (scrollProgress - 1.0) / 0.2),
              transform: scrollProgress <= 1.0
                ? `translateY(${(1 - Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35))) * 40}px)`
                : `translateY(-${(scrollProgress - 1.0) / 0.2 * 40}px)`
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
              // Exit mirrors entrance but moves upward while fading out
              opacity: scrollProgress <= 1.0 
                ? 1
                : Math.max(0, 1 - (scrollProgress - 1.0) / 0.2),
              transform: scrollProgress <= 1.0
                ? 'translateY(0px)'
                : `translateY(-${(scrollProgress - 1.0) / 0.2 * 40}px)`,
            }}
          >
            {(() => {
              const phrase = 'Build Value Together With AI'
              const words = phrase.split(' ')
              const totalLetters = phrase.replace(/\s+/g, '').length
              // Progress -> number of revealed letters (spaces excluded)
              // Entrance: 0.05 -> 0.95, Exit: keep fully visible while parent moves up/fades
              const textProgress = scrollProgress <= 1.0 
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
        </TracingBeam>
      </section>

      {/* Third Page - Left sticky intro + Right name with falling hover text */}
      <section className="page-section third-page" id="third-section">
        <div className="third-container third-grid">
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
          <div className="third-right right-stage">
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
    </>
  )
}

export default App
