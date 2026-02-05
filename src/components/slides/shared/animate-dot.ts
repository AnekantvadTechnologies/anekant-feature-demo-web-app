import gsap from "gsap";

/**
 * Animate a dot element along an SVG path within a GSAP timeline.
 *
 * The dot fades in, travels the full length of the path, then fades out.
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
      opacity: 1,
      duration,
      ease: "power1.inOut",
      onUpdate() {
        const progress: number = this.progress();
        const pt = path.getPointAtLength(progress * len);
        gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
      },
      onComplete() {
        gsap.set(dot, { opacity: 0 });
      },
    },
    startTime,
  );
}

/**
 * Animate a dot in REVERSE along an SVG path (end → start).
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
      opacity: 1,
      duration,
      ease: "power1.inOut",
      onUpdate() {
        const progress: number = this.progress();
        const pt = path.getPointAtLength((1 - progress) * len);
        gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
      },
      onComplete() {
        gsap.set(dot, { opacity: 0 });
      },
    },
    startTime,
  );
}
