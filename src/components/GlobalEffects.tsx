import Dither from './Dither'
import './GlobalEffects.css'

interface GlobalEffectsProps {
  mousePosition: { x: number; y: number }
  isImageHovered: boolean
}

export default function GlobalEffects({ mousePosition, isImageHovered }: GlobalEffectsProps) {
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
    </>
  )
}