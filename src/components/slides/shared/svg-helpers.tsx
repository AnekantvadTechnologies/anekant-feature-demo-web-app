/* ────────────────────────────────────────────────────────────
 *  Reusable SVG helper components for slide diagrams
 *  Warm Industrial aesthetic - amber/orange/coral palette
 * ──────────────────────────────────────────────────────────── */

/** Subtle dot-grid background pattern with warm tone */
export function DotGrid({ id = "dotgrid" }: { id?: string }) {
  return (
    <pattern
      id={id}
      x="0"
      y="0"
      width="38"
      height="38"
      patternUnits="userSpaceOnUse"
    >
      <circle
        cx="19"
        cy="19"
        r="0.6"
        fill="var(--text-muted)"
        opacity="0.08"
      />
    </pattern>
  );
}

/** Warm glow filter with enhanced visibility */
export function GlowFilter({
  id,
  stdDev = 3.5,
}: {
  id: string;
  stdDev?: number;
}) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={stdDev} result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/** Standard set of warm glow filter defs - NO blue/purple */
export function StandardDefs({ dotGridId = "dotgrid" }: { dotGridId?: string }) {
  return (
    <>
      <DotGrid id={dotGridId} />
      <GlowFilter id="glowRed" stdDev={3} />
      <GlowFilter id="glowAmber" stdDev={3.5} />
      <GlowFilter id="glowGold" stdDev={3.5} />
      <GlowFilter id="glowOrange" stdDev={3} />
      <GlowFilter id="glowCoral" stdDev={3} />
      <GlowFilter id="glowGreen" stdDev={3} />
    </>
  );
}
