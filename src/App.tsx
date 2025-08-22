import { useState, useEffect, useRef } from 'react'
import './App.css'
import SearchPage from './components/pages/SearchPage'
import ContentPage from './components/pages/ContentPage'
import NamePage from './components/pages/NamePage'
import ProjectsPage from './components/pages/ProjectsPage'
import ScrollController from './components/ScrollController'
import GlobalEffects from './components/GlobalEffects'

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isImageHovered, setIsImageHovered] = useState(false)
  const [isContentSticky, setIsContentSticky] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0) // 0..1 progress for second section
  const textContentRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  // Third page sticky + progress
  const [thirdSticky, setThirdSticky] = useState(false)
  const [thirdProgress, setThirdProgress] = useState(0)
  const [thirdRawProgress, setThirdRawProgress] = useState(0) // unclamped for reverse scroll
  const thirdSectionRef = useRef<HTMLElement>(null)
  const thirdContainerRef = useRef<HTMLDivElement>(null)
  // Fourth page sticky + progress
  const [fourthSticky, setFourthSticky] = useState(false)
  const [fourthProgress, setFourthProgress] = useState(0)
  const [fourthRawProgress, setFourthRawProgress] = useState(0)
  const fourthSectionRef = useRef<HTMLElement>(null)
  const fourthContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      <GlobalEffects mousePosition={mousePosition} isImageHovered={isImageHovered} />

      {/* First Page - Search Interface */}
      <SearchPage isImageHovered={isImageHovered} />

      {/* Second Page - Animated Content */}
      <ContentPage
        scrollProgress={scrollProgress}
        isContentSticky={isContentSticky}
        isImageHovered={isImageHovered}
        contentContainerRef={contentContainerRef}
        textContentRef={textContentRef}
        setIsImageHovered={setIsImageHovered}
      />

      {/* Third Page - Name Page */}
      <NamePage
        thirdSticky={thirdSticky}
        thirdProgress={thirdProgress}
        thirdRawProgress={thirdRawProgress}
        thirdSectionRef={thirdSectionRef}
        thirdContainerRef={thirdContainerRef}
      />

      {/* Fourth Page - Projects Page */}
      <ProjectsPage
        fourthSticky={fourthSticky}
        fourthProgress={fourthProgress}
        fourthRawProgress={fourthRawProgress}
        fourthSectionRef={fourthSectionRef}
        fourthContainerRef={fourthContainerRef}
      />

      {/* Scroll Controller */}
      <ScrollController
        textContentRef={textContentRef}
        contentContainerRef={contentContainerRef}
        thirdSectionRef={thirdSectionRef}
        thirdContainerRef={thirdContainerRef}
        fourthSectionRef={fourthSectionRef}
        fourthContainerRef={fourthContainerRef}
        onScrollProgressChange={setScrollProgress}
        onContentStickyChange={setIsContentSticky}
        onThirdProgressChange={setThirdProgress}
        onThirdRawProgressChange={setThirdRawProgress}
        onThirdStickyChange={setThirdSticky}
        onFourthProgressChange={setFourthProgress}
        onFourthRawProgressChange={setFourthRawProgress}
        onFourthStickyChange={setFourthSticky}
      />
    </>
  )
}

export default App
