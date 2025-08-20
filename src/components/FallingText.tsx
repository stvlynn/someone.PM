import { useRef, useState, useEffect } from "react";
import Matter from "matter-js";

interface FallingTextProps {
  text?: string;
  trigger?: "auto" | "scroll" | "click" | "hover";
  backgroundColor?: string;
  wireframes?: boolean;
  gravity?: number;
  mouseConstraintStiffness?: number;
  fontSize?: string;
  className?: string;
  height?: number; // container height in px
  textColor?: string;
  fontFamily?: string;
  opacity?: number;
  spacing?: number; // px between words
  wordSizing?: "uniform" | "cloud"; // cloud => varied font sizes per word
}

const splitWords = (input: string): string[] => input
  .split(/\s+/)
  .filter(Boolean);

const FallingText: React.FC<FallingTextProps> = ({
  text = "",
  trigger = "auto",
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
  fontSize = "2.25rem",
  className = "",
  height = 360,
  textColor = "#ffffff",
  fontFamily = '"Jersey 20", sans-serif',
  opacity = 0.25,
  spacing = 12,
  wordSizing = "cloud",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const [effectStarted, setEffectStarted] = useState(false);

  // Inject word spans (no wrap per word, variable sizes for cloud)
  useEffect(() => {
    if (!textRef.current) return;
    const words = splitWords(text);
    const html = words
      .map((w) => {
        return `<span class="inline-block select-none"
          style="white-space:nowrap;margin-right:${spacing}px;transform-origin:center;">
            <span style="display:inline-block;">${w}</span>
        </span>`;
      })
      .join("");
    textRef.current.innerHTML = html;

    // Apply per-word font size variance post-insert to compute px reliably
    if (wordSizing === "cloud") {
      const base = parseFloat(fontSize);
      const unit = (fontSize.match(/[a-z%]+$/i)?.[0]) || "rem";
      const wrappers = Array.from(textRef.current.querySelectorAll(':scope > span')) as HTMLElement[];
      wrappers.forEach((wrap) => {
        const factor = 0.85 + Math.random() * 0.6; // 0.85x - 1.45x
        const inner = wrap.firstElementChild as HTMLElement | null;
        if (inner) inner.style.fontSize = `${base * factor}${unit}`;
      });
    }
  }, [text, spacing, wordSizing, fontSize]);

  // Trigger logic
  useEffect(() => {
    if (trigger === "auto") {
      setEffectStarted(true);
      return;
    }
    if (trigger === "scroll" && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEffectStarted(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger]);

  // Physics setup
  useEffect(() => {
    if (!effectStarted) return;
    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;
    if (!containerRef.current || !canvasContainerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const stageHeight = height || containerRect.height || 320;
    if (width <= 0 || stageHeight <= 0) return;

    const engine = Engine.create();
    engine.world.gravity.y = gravity;

    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height: stageHeight,
        background: backgroundColor,
        wireframes,
      },
    });

    const boundaryOptions = { isStatic: true, render: { fillStyle: "transparent" } } as const;
    const floor = Bodies.rectangle(width / 2, stageHeight + 25, width, 50, boundaryOptions);
    const leftWall = Bodies.rectangle(-25, stageHeight / 2, 50, stageHeight, boundaryOptions);
    const rightWall = Bodies.rectangle(width + 25, stageHeight / 2, 50, stageHeight, boundaryOptions);
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions);

    if (!textRef.current) return;
    // Only top-level word wrappers as bodies
    const spans = textRef.current.querySelectorAll(':scope > span');
    const bodies = Array.from(spans).map((elem) => {
      const rect = (elem as HTMLElement).getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;
      const body = Bodies.rectangle(x, y, Math.max(8, rect.width), Math.max(12, rect.height), {
        render: { fillStyle: "transparent" },
        restitution: 0.8,
        frictionAir: 0.01,
        friction: 0.2,
      });
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: 0 });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      return { elem: elem as HTMLElement, body };
    });

    // Initial absolute positioning (no translate)
    bodies.forEach(({ elem, body }) => {
      elem.style.position = "absolute";
      elem.style.left = `${body.position.x - body.bounds.max.x + body.bounds.min.x / 2}px`;
      elem.style.top = `${body.position.y - body.bounds.max.y + body.bounds.min.y / 2}px`;
      elem.style.transform = "none";
    });

    const mouse = Mouse.create(containerRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: mouseConstraintStiffness, render: { visible: false } },
    });
    render.mouse = mouse;

    World.add(engine.world, [floor, leftWall, rightWall, ceiling, mouseConstraint, ...bodies.map((b) => b.body)]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    const update = () => {
      bodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      Matter.Engine.update(engine);
      requestAnimationFrame(update);
    };
    update();

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasContainerRef.current) {
        canvasContainerRef.current.removeChild(render.canvas);
      }
      World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, [effectStarted, gravity, wireframes, backgroundColor, mouseConstraintStiffness, height]);

  const handleTrigger = () => {
    if (!effectStarted && (trigger === "click" || trigger === "hover")) setEffectStarted(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-[1] w-full cursor-pointer text-center overflow-hidden ${className || ""}`}
      style={{ height, opacity }}
      onClick={trigger === "click" ? handleTrigger : undefined}
      onMouseEnter={trigger === "hover" ? handleTrigger : undefined}
    >
      <div
        ref={textRef}
        className="inline-block"
        style={{ fontSize, lineHeight: 1.4, color: textColor, fontFamily }}
      />
      <div className="absolute top-0 left-0 z-0 w-full h-full" ref={canvasContainerRef} />
    </div>
  );
};

export default FallingText;
