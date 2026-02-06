import {
  ENGINE_ITEMS,
  ITEM_H,
  ITEM_W,
  itemX,
  itemY,
  bezierH,
} from "./constants";

/* ────────────────────────────────────────────────────────────
 *  Reusable engine box SVG component
 *  Warm Industrial aesthetic - scaled 20% larger
 *
 *  Renders an engine rectangle with:
 *    - Label in top-left corner
 *    - Tick entry indicator on left edge
 *    - 4 internal items (Candles, Indicators, Metrics, Strategy)
 *    - Internal fan-out paths from entry point to each item
 *    - Animated checkmarks per item (driven by GSAP externally)
 * ──────────────────────────────────────────────────────────── */

export interface EngineBoxProps {
  /** Centre X of the engine rectangle */
  cx: number;
  /** Centre Y of the engine rectangle */
  cy: number;
  /** Width of the engine rectangle */
  w: number;
  /** Height of the engine rectangle */
  h: number;
  /** Display label, e.g. "Engine 1" */
  label: string;
  /** Numeric index used to build unique CSS class names for GSAP targeting */
  engineIdx: number;
  /** Optional extra badge text shown below the label (e.g. "Same engine code") */
  badge?: string;
  /** Stroke color for the outer box (defaults to --accent-amber) */
  strokeColor?: string;
}

export function EngineBox({
  cx,
  cy,
  w,
  h,
  label,
  engineIdx,
  badge,
  strokeColor = "var(--accent-amber)",
}: EngineBoxProps) {
  return (
    <g className="ane-node" style={{ opacity: 0 }}>
      {/* Outer engine box */}
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={17}
        fill="var(--bg-card)"
        stroke={strokeColor}
        strokeWidth={1.8}
      />

      {/* Engine label (top-left) - scaled */}
      <text
        x={cx - w / 2 + 22}
        y={cy - h / 2 + 26}
        className="text-[16px] font-bold"
        fill={strokeColor}
      >
        {label}
      </text>

      {/* Optional badge (below label) */}
      {badge && (
        <text
          x={cx - w / 2 + 22}
          y={cy - h / 2 + 48}
          className="text-[10px] font-medium"
          fill="var(--accent-emerald)"
          opacity={0.85}
        >
          {badge}
        </text>
      )}

      {/* Tick entry indicator on left edge */}
      <circle
        cx={cx - w / 2}
        cy={cy}
        r={5}
        fill={strokeColor}
        opacity={0.4}
      />

      {/* Internal items */}
      {ENGINE_ITEMS.map((itemLabel, iIdx) => {
        const ix = itemX(cx);
        const iy = itemY(cy, h, iIdx);
        return (
          <g
            key={`ei-${engineIdx}-${iIdx}`}
            className="engine-item"
            style={{ opacity: 0 }}
          >
            <rect
              x={ix - ITEM_W / 2}
              y={iy - ITEM_H / 2}
              width={ITEM_W}
              height={ITEM_H}
              rx={7}
              fill="var(--bg-secondary)"
              stroke="var(--accent-emerald)"
              strokeWidth={1}
              opacity={0.7}
            />
            <text
              x={ix}
              y={iy + 5}
              textAnchor="middle"
              className="text-[13px] font-semibold"
              fill="var(--accent-emerald)"
            >
              {itemLabel}
            </text>

            {/* Checkmark (animated by GSAP loop externally) */}
            <g className="engine-check" style={{ opacity: 0 }}>
              <circle
                cx={ix + ITEM_W / 2 + 17}
                cy={iy}
                r={10}
                fill="color-mix(in srgb, var(--accent-emerald) 18%, transparent)"
                stroke="var(--accent-emerald)"
                strokeWidth={1}
              />
              <text
                x={ix + ITEM_W / 2 + 17}
                y={iy + 5}
                textAnchor="middle"
                className="text-[12px] font-bold"
                fill="var(--accent-emerald)"
              >
                ✓
              </text>
            </g>
          </g>
        );
      })}

      {/* Internal fan-out paths (entry → each item) */}
      {ENGINE_ITEMS.map((_, iIdx) => {
        const x1 = cx - w / 2 + 24;
        const y1 = cy;
        const x2 = itemX(cx) - ITEM_W / 2;
        const y2 = itemY(cy, h, iIdx);
        return (
          <path
            key={`ip-${engineIdx}-${iIdx}`}
            d={bezierH(x1, y1, x2, y2)}
            className={`int-path int-path-${engineIdx}-${iIdx}`}
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth={1.2}
            opacity={0.25}
          />
        );
      })}
    </g>
  );
}

/**
 * Compute the number of ENGINE_ITEMS (useful for animation loops).
 */
export const ENGINE_ITEM_COUNT = ENGINE_ITEMS.length;
