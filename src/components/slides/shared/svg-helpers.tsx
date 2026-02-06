/* ────────────────────────────────────────────────────────────
 *  Reusable SVG helper components for slide diagrams
 * ──────────────────────────────────────────────────────────── */

/** Very subtle dot-grid background pattern for minimalist aesthetic */
export function DotGrid({ id = "dotgrid" }: { id?: string }) {
  return (
    <pattern
      id={id}
      x="0"
      y="0"
      width="32"
      height="32"
      patternUnits="userSpaceOnUse"
    >
      <circle
        cx="16"
        cy="16"
        r="0.5"
        fill="var(--text-muted)"
        opacity="0.06"
      />
    </pattern>
  );
}

/** Refined soft glow filter for minimalist aesthetic */
export function GlowFilter({
  id,
  stdDev = 3,
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

/** Standard set of refined glow filter defs used across slides */
export function StandardDefs({ dotGridId = "dotgrid" }: { dotGridId?: string }) {
  return (
    <>
      <DotGrid id={dotGridId} />
      <GlowFilter id="glowRed" stdDev={2.5} />
      <GlowFilter id="glowCyan" stdDev={3} />
      <GlowFilter id="glowGreen" stdDev={2.5} />
      <GlowFilter id="glowPurple" stdDev={2.5} />
      <GlowFilter id="glowOrange" stdDev={2.5} />
    </>
  );
}
