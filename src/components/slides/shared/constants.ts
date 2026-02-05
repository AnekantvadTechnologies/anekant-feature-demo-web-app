/* ────────────────────────────────────────────────────────────
 *  Shared constants used across all slide SVG diagrams
 * ──────────────────────────────────────────────────────────── */

/** Default SVG viewBox dimensions */
export const VB_W = 1400;
export const VB_H = 780;

/** Internal items rendered inside each engine box */
export const ENGINE_ITEMS = ["Candles", "Indicators", "Metrics", "Strategy"];

/** Dimensions for internal sub-items within an engine */
export const ITEM_H = 26;
export const ITEM_W = 110;
export const ITEM_GAP = 6;

/** Calculate the Y position of an internal item within an engine */
export function itemY(
  engineCy: number,
  engineH: number,
  itemIdx: number,
): number {
  const engineTop = engineCy - engineH / 2;
  const itemsBlockH =
    ENGINE_ITEMS.length * ITEM_H + (ENGINE_ITEMS.length - 1) * ITEM_GAP;
  const startY = engineTop + (engineH - itemsBlockH) / 2;
  return startY + itemIdx * (ITEM_H + ITEM_GAP) + ITEM_H / 2;
}

/** Calculate the X position of an internal item within an engine */
export function itemX(engineCx: number): number {
  return engineCx + 30;
}

/** Build a bezier curve path between two points with horizontal ease */
export function bezierH(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
}
