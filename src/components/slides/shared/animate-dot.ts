import gsap from "gsap";

/**
 * Animate a dot element along an SVG path within a GSAP timeline.
 * Refined for subtle, professional animation with smooth easing.
 */
export function animateDot(
  dot: SVGCircleElement,
  path: SVGPathElement,
  tl: gsap.core.Timeline,
  duration: number,
  startTime: number | string,
): void {
  const len = path.getTotalLength();
  tl.fromTo(
    dot,
    { opacity: 0 },
    {
      opacity: 0.9, // Slightly reduced for subtlety
      duration,
      ease: "sine.inOut", // Smoother, more refined easing
      onUpdate() {
        const progress: number = this.progress();
        const pt = path.getPointAtLength(progress * len);
        gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
      },
      onComplete() {
        gsap.to(dot, { opacity: 0, duration: 0.12, ease: "power2.out" });
      },
    },
    startTime,
  );
}

/**
 * Animate a dot in REVERSE along an SVG path (end → start).
 * Refined for subtle, professional animation with smooth easing.
 */
export function animateDotReverse(
  dot: SVGCircleElement,
  path: SVGPathElement,
  tl: gsap.core.Timeline,
  duration: number,
  startTime: number | string,
): void {
  const len = path.getTotalLength();
  tl.fromTo(
    dot,
    { opacity: 0 },
    {
      opacity: 0.9, // Slightly reduced for subtlety
      duration,
      ease: "sine.inOut", // Smoother, more refined easing
      onUpdate() {
        const progress: number = this.progress();
        const pt = path.getPointAtLength((1 - progress) * len);
        gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
      },
      onComplete() {
        gsap.to(dot, { opacity: 0, duration: 0.12, ease: "power2.out" });
      },
    },
    startTime,
  );
}
