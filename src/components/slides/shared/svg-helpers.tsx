/* ────────────────────────────────────────────────────────────
 *  Reusable SVG helper components for slide diagrams
 * ──────────────────────────────────────────────────────────── */

/** Subtle dot-grid background pattern */
export function DotGrid({ id = "dotgrid" }: { id?: string }) {
  return (
    <pattern
      id={id}
      x="0"
      y="0"
      width="24"
      height="24"
      patternUnits="userSpaceOnUse"
    >
      <circle
        cx="12"
        cy="12"
        r="0.7"
        fill="var(--text-muted)"
        opacity="0.15"
      />
    </pattern>
  );
}

/** Gaussian blur + composite glow filter */
export function GlowFilter({
  id,
  stdDev = 4,
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

/** Standard set of glow filter defs used across slides */
export function StandardDefs({ dotGridId = "dotgrid" }: { dotGridId?: string }) {
  return (
    <>
      <DotGrid id={dotGridId} />
      <GlowFilter id="glowRed" stdDev={3} />
      <GlowFilter id="glowCyan" stdDev={4} />
      <GlowFilter id="glowGreen" stdDev={3} />
      <GlowFilter id="glowPurple" stdDev={3} />
      <GlowFilter id="glowOrange" stdDev={3} />
    </>
  );
}
