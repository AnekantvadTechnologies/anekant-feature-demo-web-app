import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

interface UseGsapTimelineOptions {
  /** Whether the timeline should play when active */
  active: boolean;
  /** Delay before playing (seconds) */
  delay?: number;
}

export function useGsapTimeline({ active, delay = 0.3 }: UseGsapTimelineOptions) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTimeline = useCallback(() => {
    if (!timelineRef.current) {
      timelineRef.current = gsap.timeline({ paused: true, delay });
    }
    return timelineRef.current;
  }, [delay]);

  useEffect(() => {
    if (active && timelineRef.current) {
      timelineRef.current.restart();
    } else if (!active && timelineRef.current) {
      timelineRef.current.pause(0);
    }
  }, [active]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  return { containerRef, getTimeline, timelineRef };
}
