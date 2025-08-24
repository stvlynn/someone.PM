import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

interface InfiniteScrollItem {
  content: React.ReactNode;
}

interface InfiniteScrollProps {
  width?: string;
  maxHeight?: string;
  negativeMargin?: string;
  items?: InfiniteScrollItem[];
  itemMinHeight?: number;
  itemGap?: number; // fixed pixel gap between items; if provided, CSS margin is ignored
  isTilted?: boolean;
  tiltDirection?: "left" | "right";
  autoplay?: boolean;
  autoplaySpeed?: number;
  autoplayDirection?: "down" | "up";
  pauseOnHover?: boolean;
  // Interaction speed multipliers
  wheelMultiplier?: number; // applied to wheel delta
  dragMultiplier?: number;  // applied to drag delta
  // Interaction animation controls (non-loop mode)
  interactionDuration?: number; // duration of the snap animation when interacting
  interactionEase?: string; // easing function for the interaction animation
  // If provided, component follows this external progress (e.g., raw page progress)
  driveProgress?: number; // raw progress value that can be negative/positive
  drivePixelPerUnit?: number; // how many pixels to move per 1 unit of progress delta
  driveScrollFactor?: number; // multiplier for direction when following scroll/progress (e.g., -1 to invert)
  listenTarget?: HTMLElement | null; // optional external element to attach Observer (e.g., whole section)
  loop?: boolean; // enable infinite wrapping; if false, clamp and allow entry/exit
  onBoundaryReached?: (boundary: 'top' | 'bottom') => void; // callback when hitting boundaries in non-loop mode
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  width = "30rem",
  maxHeight = "100%",
  negativeMargin = "-0.5em",
  items = [],
  itemMinHeight = 150,
  itemGap = 0,
  isTilted = false,
  tiltDirection = "left",
  autoplay = false,
  autoplaySpeed = 0.5,
  autoplayDirection = "down",
  pauseOnHover = false,
  wheelMultiplier = 6,
  dragMultiplier = 3,
  interactionDuration = 0.4,
  interactionEase = 'expo.out',
  driveProgress,
  drivePixelPerUnit = 240,
  driveScrollFactor = -1,
  listenTarget,
  loop = true,
  onBoundaryReached,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const totalItemHeightRef = useRef<number>(0);
  const totalHeightRef = useRef<number>(0);
  const prevProgressRef = useRef<number | undefined>(undefined);
  const baseOffsetRef = useRef<number>(0); // shared offset for non-loop mode
  const wrapperHeightRef = useRef<number>(0); // cache wrapper height for boundary logic

  const getTiltTransform = (): string => {
    if (!isTilted) return "none";
    return tiltDirection === "left"
      ? "rotateX(20deg) rotateZ(-20deg) skewX(20deg)"
      : "rotateX(20deg) rotateZ(20deg) skewX(-20deg)";
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (items.length === 0) return;

    const divItems = gsap.utils.toArray<HTMLDivElement>(container.children);
    if (!divItems.length) return;
    itemsRef.current = divItems;

    // Measurements
    const firstItem = divItems[0];
    const itemHeight = firstItem.offsetHeight; // we control spacing ourselves, ignore CSS margins
    const totalItemHeight = itemHeight + (itemGap || 0);
    const totalHeight = itemHeight * items.length + (itemGap || 0) * (items.length - 1);
    totalItemHeightRef.current = totalItemHeight;
    totalHeightRef.current = totalHeight;

    // Setup container and items layout: absolute items in a relative container
    const snapY = gsap.utils.snap(1);
    gsap.set(container, { position: 'relative', height: totalHeight });
    divItems.forEach((child, i) => {
      const y = snapY(i * totalItemHeight);
      gsap.set(child, { position: 'absolute', top: 0, left: 0, right: 0, y });
    });

    // Create wrap function for loop mode
    const wrapFn = gsap.utils.wrap(-totalHeight, totalHeight);

    // Snapping helper to avoid sub-pixel jitter (reuse variable)

    // Measure wrapper height for center-based boundary logic
    const measureWrapper = () => {
      const wrapperEl = wrapperRef.current;
      if (wrapperEl) {
        wrapperHeightRef.current = wrapperEl.clientHeight;
      }
    };
    measureWrapper();
    window.addEventListener('resize', measureWrapper);

    // initialize progress baseline if in drive mode
    if (driveProgress !== undefined) {
      prevProgressRef.current = driveProgress;
    }

    // Attach Observer to provided listenTarget or fallback to container
    const observer = Observer.create({
      target: listenTarget || container,
      type: "wheel,touch,pointer",
      preventDefault: false, // conditionally prevent default inside onChange
      onPress: ({ target }) => {
        (target as HTMLElement).style.cursor = "grabbing";
      },
      onRelease: ({ target }) => {
        (target as HTMLElement).style.cursor = "grab";
      },
      onChange: ({ deltaY, isDragging, event }) => {
        const d = (event as any).type === "wheel" ? -deltaY : deltaY;
        const distance = isDragging ? d * dragMultiplier : d * wheelMultiplier;
        if (!loop) {
          // Use wrapper midpoint so we trigger when the first card's top hits center
          const halfWrapper = wrapperHeightRef.current > 0 ? wrapperHeightRef.current / 2 : totalItemHeight;
          const upperBound = Math.min(halfWrapper, totalItemHeight * 1.0);
          const lowerBound = -totalHeight + totalItemHeight; // min
          const nextBase = baseOffsetRef.current + distance;
          const clamped = Math.max(lowerBound, Math.min(upperBound, nextBase));

          if (clamped === baseOffsetRef.current) {
            // at boundary: let native scroll continue and notify once per direction
            if (distance > 0) onBoundaryReached && onBoundaryReached('top');
            else if (distance < 0) onBoundaryReached && onBoundaryReached('bottom');
            return; // do not prevent default
          }

          (event as Event).preventDefault();
          baseOffsetRef.current = clamped;
          divItems.forEach((child, i) => {
            gsap.to(child, {
              duration: interactionDuration,
              ease: interactionEase,
              y: snapY(baseOffsetRef.current + i * totalItemHeight),
            });
          });
        } else {
          // loop mode: wrap each item
          (event as Event).preventDefault();
          divItems.forEach((child) => {
            gsap.to(child, {
              duration: 0.5,
              ease: "expo.out",
              y: `+=${distance}`,
              modifiers: { y: gsap.utils.unitize(wrapFn) },
            });
          });
        }
      },
    });

    let rafId: number;
    if (autoplay && loop) { // only autoplay in loop mode
      const directionFactor = autoplayDirection === "down" ? 1 : -1;
      const speedPerFrame = autoplaySpeed * directionFactor;

      const tick = () => {
        divItems.forEach((child) => {
          gsap.set(child, { y: `+=${speedPerFrame}`, modifiers: { y: gsap.utils.unitize(wrapFn) } });
        });
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      if (pauseOnHover) {
        const stopTicker = () => rafId && cancelAnimationFrame(rafId);
        const startTicker = () => {
          rafId = requestAnimationFrame(tick);
        };

        container.addEventListener("mouseenter", stopTicker);
        container.addEventListener("mouseleave", startTicker);

        return () => {
          observer.kill();
          stopTicker();
          container.removeEventListener("mouseenter", stopTicker);
          container.removeEventListener("mouseleave", startTicker);
          window.removeEventListener('resize', measureWrapper);
        };
      } else {
        return () => {
          observer.kill();
          rafId && cancelAnimationFrame(rafId);
          window.removeEventListener('resize', measureWrapper);
        };
      }
    }

    return () => {
      observer.kill();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measureWrapper);
    };
  }, [
    items,
    autoplay,
    autoplaySpeed,
    autoplayDirection,
    pauseOnHover,
    isTilted,
    tiltDirection,
    negativeMargin,
    driveProgress,
    listenTarget,
  ]);

  // External progress driver: move by delta when driveProgress changes
  useEffect(() => {
    if (driveProgress === undefined) return;
    const divItems = itemsRef.current;
    if (!divItems.length) return;
    const prev = prevProgressRef.current;
    prevProgressRef.current = driveProgress;
    if (prev === undefined) return; // first run only initializes

    const delta = driveProgress - prev;
    if (delta === 0) return;
    const distance = delta * drivePixelPerUnit * driveScrollFactor;
    if (loop) {
      const wrap = gsap.utils.wrap(-totalHeightRef.current, totalHeightRef.current);
      divItems.forEach((child) => {
        gsap.set(child, { y: `+=${distance}`, modifiers: { y: gsap.utils.unitize(wrap) } });
      });
    } else {
      const upper = totalItemHeightRef.current;
      const lower = -totalHeightRef.current + totalItemHeightRef.current;
      const nextBase = baseOffsetRef.current + distance;
      const clamped = Math.max(lower, Math.min(upper, nextBase));
      baseOffsetRef.current = clamped;
      const snap = gsap.utils.snap(1);
      divItems.forEach((child, i) => {
        gsap.set(child, { y: snap(baseOffsetRef.current + i * totalItemHeightRef.current) });
      });
    }
  }, [driveProgress, drivePixelPerUnit]);

  // Removed window scroll coupling to avoid conflicts with Observer-driven interactions

  return (
    <>
      <style>{`
          .infinite-scroll-wrapper { max-height: ${maxHeight}; }
          .infinite-scroll-container { width: ${width}; will-change: transform; }
          .infinite-scroll-item { height: ${itemMinHeight}px; ${itemGap ? 'margin-top: 0px;' : `margin-top: ${negativeMargin};`} will-change: transform; backface-visibility: hidden; }
        `}</style>

      <div className="infinite-scroll-wrapper" ref={wrapperRef}>
        <div
          className="infinite-scroll-container"
          ref={containerRef}
          style={{ transform: getTiltTransform() }}
        >
          {items.map((item, i) => (
            <div className="infinite-scroll-item" key={i}>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default InfiniteScroll;
