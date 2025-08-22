import { useEffect } from 'react'

interface ScrollControllerProps {
  textContentRef: React.RefObject<HTMLDivElement | null>
  contentContainerRef: React.RefObject<HTMLDivElement | null>
  thirdSectionRef: React.RefObject<HTMLElement | null>
  thirdContainerRef: React.RefObject<HTMLDivElement | null>
  onScrollProgressChange: (progress: number) => void
  onContentStickyChange: (sticky: boolean) => void
  onThirdProgressChange: (progress: number) => void
  onThirdRawProgressChange: (rawProgress: number) => void
  onThirdStickyChange: (sticky: boolean) => void
}

export default function ScrollController({
  textContentRef,
  contentContainerRef,
  thirdSectionRef,
  thirdContainerRef,
  onScrollProgressChange,
  onContentStickyChange,
  onThirdProgressChange,
  onThirdRawProgressChange,
  onThirdStickyChange
}: ScrollControllerProps) {
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
      onScrollProgressChange(extendedProgress)

      // Add a release leeway so sticky remains a bit longer after fully revealed
      const releaseThreshold = 1.35 // allow some extra scroll before exit kicks in
      const shouldBeSticky = pastFirstScreen && rawProgress < releaseThreshold
      onContentStickyChange(shouldBeSticky)

      // ---- Third page progress & sticky ----
      if (thirdSectionRef.current && thirdContainerRef.current) {
        const thirdTop = thirdSectionRef.current.offsetTop
        // Start progress a bit before the third section top reaches viewport top
        const thirdRaw = (scrollY - (thirdTop - windowHeight * 0.2)) / (windowHeight * 0.9)
        onThirdRawProgressChange(thirdRaw)
        const thirdExt = Math.max(0, thirdRaw)
        onThirdProgressChange(thirdExt)
        // Keep sticky until some leeway after fully visible (match second page)
        const thirdRelease = 1.35
        // Stay sticky slightly before the section begins (thirdRaw > -0.15) to enable reverse flip
        const thirdShouldStick = scrollY > thirdTop - windowHeight * 0.6 && thirdRaw < thirdRelease && thirdRaw > -0.15
        onThirdStickyChange(thirdShouldStick)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [
    textContentRef,
    contentContainerRef,
    thirdSectionRef,
    thirdContainerRef,
    onScrollProgressChange,
    onContentStickyChange,
    onThirdProgressChange,
    onThirdRawProgressChange,
    onThirdStickyChange
  ])

  return null
}