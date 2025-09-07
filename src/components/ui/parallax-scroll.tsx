"use client";
import { useScroll, useTransform } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ParallaxItem {
  src: string;
  title?: string;
  location?: string;
}

export const ParallaxScroll = ({
  images,
  items,
  className,
}: {
  images?: string[];
  items?: ParallaxItem[];
  className?: string;
}) => {
  // Normalize into items array with metadata if provided
  const list: ParallaxItem[] = useMemo(() => {
    if (items && Array.isArray(items)) return items;
    if (images && Array.isArray(images)) return images.map((src) => ({ src }));
    return [];
  }, [images, items]);

  const gridRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: gridRef, // remove this if your container is not fixed height
    offset: ["start start", "end start"], // remove this if your container is not fixed height
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const [hovered, setHovered] = useState<number | null>(null);

  const third = Math.ceil(list.length / 3);
  const firstPart = list.slice(0, third);
  const secondPart = list.slice(third, 2 * third);
  const thirdPart = list.slice(2 * third);

  const Card = ({ item, globalIndex, y }: { item: ParallaxItem; globalIndex: number; y: any }) => (
    <motion.div style={{ y }} key={globalIndex}>
      <div
        onMouseEnter={() => setHovered(globalIndex)}
        onMouseLeave={() => setHovered(null)}
        className={cn(
          "rounded-lg relative bg-neutral-900/40 overflow-hidden h-80 w-full transition-all duration-300 ease-out",
          hovered !== null && hovered !== globalIndex && "blur-sm scale-[0.98]"
        )}
      >
        <img
          src={item.src}
          alt={item.title || `photo-${globalIndex}`}
          className="object-cover absolute inset-0 w-full h-full"
          loading="lazy"
        />
        {(item.title || item.location) && (
          <div
            className={cn(
              "absolute inset-0 rounded-lg bg-black/50 transition-opacity duration-300",
              hovered === globalIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="absolute left-7 right-5 bottom-9">
              {item.title && (
                <div className="text-left text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
                  {item.title}
                </div>
              )}
              {item.location && (
                <div className="mt-1 text-sm text-neutral-200/95 flex items-center gap-2">
                  <MapPin className="w-4 h-4 opacity-90" />
                  <span>{item.location}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div
      className={cn("h-[40rem] items-start overflow-y-auto w-full", className)}
      ref={gridRef}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start max-w-5xl mx-auto gap-10 py-40 px-10">
        <div className="grid gap-10">
          {firstPart.map((el, idx) => (
            <Card key={idx} item={el} globalIndex={idx} y={translateFirst} />
          ))}
        </div>
        <div className="grid gap-10">
          {secondPart.map((el, idx) => (
            <Card key={idx + firstPart.length} item={el} globalIndex={idx + firstPart.length} y={translateSecond} />
          ))}
        </div>
        <div className="grid gap-10">
          {thirdPart.map((el, idx) => (
            <Card key={idx + firstPart.length + secondPart.length} item={el} globalIndex={idx + firstPart.length + secondPart.length} y={translateThird} />
          ))}
        </div>
      </div>
    </div>
  );
};
