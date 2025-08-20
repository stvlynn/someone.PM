import { useState, useEffect, useRef } from 'react'
import './App.css'
import Dither from './components/Dither'
import SearchInterface from './components/SearchInterface'
import { EvervaultCard } from './components/ui/evervault-card'
import stvWhite from './assets/stv-white.png'

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isImageHovered, setIsImageHovered] = useState(false)
  const [isContentSticky, setIsContentSticky] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0) // 0..1 progress for second section
  const textContentRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)

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
      // Calculate scroll progress for text animation based on scroll position
      const textScrollProgress = Math.max(0, Math.min(1, 
        (scrollY - windowHeight) / (windowHeight * 1.5)
      ))
      setScrollProgress(textScrollProgress)

      // Add a release leeway so sticky remains a bit longer after fully revealed
      const releaseThreshold = 1.15
      const shouldBeSticky = pastFirstScreen && textScrollProgress < releaseThreshold
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

      {/* Second Page - Animated Content */}
      <section className="page-section content-page" id="content-section">
        <div ref={contentContainerRef} className={`content-container ${isContentSticky ? 'sticky-content' : ''}`}>
          <div
            className="image-content relative z-30"
            style={{
              // Smooth entrance: fade + slight upward translate driven by scroll
              opacity: Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35)),
              transform: `translateY(${(1 - Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35))) * 40}px)`
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
          <div ref={textContentRef} className={`text-content transition-all duration-300 ${
            isImageHovered ? 'blur-sm' : ''
          }`}>
            {(() => {
              const phrase = 'Build Value Together With AI'
              const words = phrase.split(' ')
              const totalLetters = phrase.replace(/\s+/g, '').length
              // Progress -> number of revealed letters (spaces excluded)
              const eased = Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.9))
              const visibleCount = Math.floor(eased * totalLetters)

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
    </>
  )
}

export default App
