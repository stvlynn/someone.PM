# Sticky Content + Left Progress Beam: Implementation Notes

This document explains how the sticky-centered content and the left progress beam are implemented, with file references and tunable parameters. It prepares the codebase for building a third page following the same patterns.

## Goals

- Keep image and text centered while the user scrolls through the second page, then release after text fully reveals.
- Enter the image smoothly as the user scrolls (fade + translateY).
- Reveal the headline per character, with one word per line.
- Show an animated progress beam pinned to the left that reflects scroll progress within the second section.

---

## Sticky Centered Content

- Files:
  - `src/App.tsx`
  - `src/App.css`

### Key State

- `isContentSticky: boolean` — whether the content is fixed-centered.
- `scrollProgress: number` — normalized 0..1 progress for second section.

Declared in `src/App.tsx`:
```ts
const [isContentSticky, setIsContentSticky] = useState(false)
const [scrollProgress, setScrollProgress] = useState(0)
```

### Scroll Logic

Inside `useEffect()` in `src/App.tsx`:
- Compute `scrollProgress` based on `window.scrollY` relative to viewport height.
- Add a release leeway so sticky remains briefly after full text reveal.

```ts
const handleScroll = () => {
  const windowHeight = window.innerHeight
  const scrollY = window.scrollY
  const pastFirstScreen = scrollY > windowHeight * 0.5

  const textScrollProgress = Math.max(0, Math.min(1,
    (scrollY - windowHeight) / (windowHeight * 1.5)
  ))
  setScrollProgress(textScrollProgress)

  const releaseThreshold = 1.15 // leeway after full reveal
  const shouldBeSticky = pastFirstScreen && textScrollProgress < releaseThreshold
  setIsContentSticky(shouldBeSticky)
}
```

Why this works:
- Sticky only activates after user clears the first half of the first screen.
- Sticky persists while text reveals and stays centered until a bit after full reveal.

### CSS For Centering

In `src/App.css`:
```css
.content-container.sticky-content {
  position: fixed !important;
  top: 50% !important;
  left: 0 !important;
  right: 0 !important;
  transform: translateY(-50%) !important;
  z-index: 25 !important;
  width: 100% !important;
  height: auto !important;
  transition: none; /* avoid diagonal snap/fly-in */
}
```

Notes:
- Vertical centering only (no translateX), so we avoid diagonal snap.
- No transitions on layout while toggling sticky.

### Section Sizing

The second section provides enough scroll space for the animation:
```css
/* src/App.css */
.content-page {
  height: auto;
  min-height: 300vh; /* long scroll distance for animation/progress */
  scroll-timeline-name: --section;
  scroll-timeline-axis: block;
  view-timeline-name: --section;
  view-timeline-axis: block;
}
```

---

## Image Entrance

In `src/App.tsx`, the image container `.image-content` uses `scrollProgress`:
```tsx
<div
  className="image-content relative z-30"
  style={{
    opacity: Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35)),
    transform: `translateY(${(1 - Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.35))) * 40}px)`
  }}
>
  ...
</div>
```

CSS hint for smooth transforms:
```css
/* src/App.css */
.image-content {
  will-change: transform, opacity;
}
```

Tuning:
- Entrance window: `(scrollProgress - 0.05) / 0.35` (start, duration)
- Distance: `40px` translate

---

## Per-Character Reveal, One Word Per Line

- Files:
  - `src/App.tsx`
  - `src/App.css`

Render structure in `src/App.tsx`:
```tsx
const phrase = 'Build Value Together With AI'
const words = phrase.split(' ')
const totalLetters = phrase.replace(/\s+/g, '').length
const eased = Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.9))
const visibleCount = Math.floor(eased * totalLetters)

let offset = 0
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
              <span key={i} className={`character ${isVisible ? 'animate-in' : ''}`}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    })}
  </div>
)
```

CSS:
```css
/* src/App.css */
.word-line { display: block; margin: 0.25rem 0; }

.character {
  display: inline-block;
  font-family: "Jersey 20", sans-serif;
  font-size: 4rem;
  color: white;
  margin: 0 0.05em;
  line-height: 1.1;
  filter: blur(10px);
  translate: 0 -75%;
  opacity: 0;
  scale: 0.8;
  transition: all 0.8s ease-out;
}

.character.animate-in {
  filter: blur(0px);
  translate: 0 0;
  opacity: 1;
  scale: 1;
}
```

---

## Left Progress Beam

- Files:
  - `src/components/ui/tracing-beam.tsx`
  - Integration: `src/App.tsx`

### Usage

Wrap the second page:
```tsx
import { TracingBeam } from './components/ui/tracing-beam'

<section className="page-section content-page" id="content-section">
  <TracingBeam className="px-6">
    <div ref={contentContainerRef} className={`content-container ${isContentSticky ? 'sticky-content' : ''}`}>
      {/* image + text */}
    </div>
  </TracingBeam>
</section>
```

### How It Works

`src/components/ui/tracing-beam.tsx`:
- Tracks scroll progress within the wrapper using `useScroll({ target: ref, offset: ["start start", "end start"] })`.
- Computes SVG height from the wrapper (not the children) and updates on resize with `ResizeObserver`.
- Animates a gradient stroke along a path using springs derived from `scrollYProgress`.

Key snippets:
```ts
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start start", "end start"],
})

const [svgHeight, setSvgHeight] = useState(0)
useEffect(() => {
  const calc = () => {
    if (ref.current) {
      const h = ref.current.getBoundingClientRect().height
      setSvgHeight(h > 0 ? h : window.innerHeight)
    }
  }
  calc()
  const ro = new ResizeObserver(calc)
  if (ref.current) ro.observe(ref.current)
  window.addEventListener('resize', calc)
  return () => { window.removeEventListener('resize', calc); ro.disconnect() }
}, [])

const y1 = useSpring(useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]), { stiffness: 500, damping: 90 })
const y2 = useSpring(useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]), { stiffness: 500, damping: 90 })
```

Positioning and layering:
```tsx
<motion.div ref={ref} className={cn("relative mx-auto h-full w-full max-w-4xl z-40", className)}>
  <div className="absolute top-3 -left-4 md:-left-20 pointer-events-none z-40">
    {/* dot + svg path with gradient */}
  </div>
  <div ref={contentRef}>{children}</div>
</motion.div>
```

Notes:
- `pointer-events-none` avoids blocking interactions.
- `z-40` ensures visibility above the sticky content.
- The path uses a gradient with moving `y1`/`y2` to create a “beam traveling” effect.

---

## Tuning & Gotchas

- Sticky release dwell: `releaseThreshold` (default `1.15`). Increase to keep content centered longer.
- Progress window:
  - Text: `eased = (scrollProgress - 0.05) / 0.9`
  - Image entrance window: `(scrollProgress - 0.05) / 0.35`
- Z-index: sticky container is `z-25`; the beam is `z-40` to render above.
- Section height: `.content-page { min-height: 300vh }` ensures enough scroll distance; adjust per design.
- Beam alignment:
  - Adjust `-left-4 md:-left-20` or add `pl-24` on `<TracingBeam>` to prevent overlap.
- Performance: `will-change: transform, opacity` on `.image-content` and CSS-only transitions on characters.

---

## Preparing Page Three

To add a third page with the same interaction pattern:

1. Create a new section container below the second:
   - `section.page-section` + a `.content-page--3` class with `height: auto; min-height: <desired>`.

2. Wrap its content with `TracingBeam`:
   - `<TracingBeam className="px-6 md:pl-24"> ... </TracingBeam>`

3. Reuse sticky pattern:
   - Either reuse the same `isContentSticky`/`scrollProgress` logic scoped to page three (recommended: extract to a hook like `useSectionScroll(sectionRef)`).
   - Or parameterize thresholds and durations for page three’s content.

4. Render strategy:
   - For headlines: keep per-character spans inside per-word lines.
   - For media: drive entrance with `scrollProgress` mapping to `opacity` + `translateY`.

5. Extract tunables:
   - Move constants like `releaseThreshold`, entrance windows, and translate distance to module-level config or props so each page can customize.

---

## Summary

- Sticky centering is driven by simple scroll thresholds and a fixed, vertically centered container (`.content-container.sticky-content`).
- The image entrance and per-character reveal are driven by a normalized `scrollProgress`.
- The `TracingBeam` visualizes scroll progress for the section using `useScroll`, springs, and a gradient path.
- The setup is modular enough to replicate for a third page by reusing the same wrapper and logic, with tunable parameters for timing and motion.
