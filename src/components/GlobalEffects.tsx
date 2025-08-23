import { useEffect, useRef } from 'react'
import Dither from './Dither'
import './GlobalEffects.css'

interface GlobalEffectsProps {
  isImageHovered: boolean
}

export default function GlobalEffects({ isImageHovered }: GlobalEffectsProps) {
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Use requestAnimationFrame to update transform for smooth 60fps updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (cursorDotRef.current) {
          // Use transform instead of left/top to avoid layout recalculation
          cursorDotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
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
      
      {/* Global Cursor Dot - using transform for better performance */}
      <div 
        ref={cursorDotRef}
        className="cursor-dot"
        style={{
          left: 0,
          top: 0,
          transform: 'translate(0px, 0px)'
        }}
      />

      {/* Background dark overlay when image is hovered */}
      <div className={`fixed inset-0 bg-black/20 pointer-events-none transition-opacity duration-300 z-20 ${
        isImageHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </>
  )
}