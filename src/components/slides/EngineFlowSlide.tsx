import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, itemX, itemY, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  EngineFlowSlide - Warm Industrial Aesthetic
 *  SCALED 20% LARGER - NO blue/purple colors
 *
 *  Single full-screen slide showing TWO rows:
 *    Top  (~30%) — Traditional setup: sequential, slow, misses ticks
 *    Bottom (~70%) — Anekant engine: Exchange → Redis → 3 Engines
 *                    (internal parallel processing) → Broker → Fills back
 * ================================================================ */

interface EngineFlowSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  TRADITIONAL ROW — top (scaled 20%)
 * ──────────────────────────────────────────────────────────── */
const DIVIDER_Y = 276;
const TRAD_Y = 168;
const TRAD_BOX_W = 192;
const TRAD_BOX_H = 58;
const TRAD_GAP = 60;

const TRAD_STEPS = [
  { label: "Exchange" },
  { label: "Poll Data" },
  { label: "Rebuild Candles" },
  { label: "Recompute Indicators" },
  { label: "Evaluate Strategy" },
];

function tradStepX(index: number): number {
  const totalW =
    TRAD_STEPS.length * TRAD_BOX_W + (TRAD_STEPS.length - 1) * TRAD_GAP;
  const startX = (VB_W - totalW) / 2;
  return startX + index * (TRAD_BOX_W + TRAD_GAP) + TRAD_BOX_W / 2;
}

function tradPath(fromIdx: number, toIdx: number): string {
  const x1 = tradStepX(fromIdx) + TRAD_BOX_W / 2;
  const x2 = tradStepX(toIdx) - TRAD_BOX_W / 2;
  return `M ${x1} ${TRAD_Y} L ${x2} ${TRAD_Y}`;
}

/* ────────────────────────────────────────────────────────────
 *  ANEKANT ROW — bottom (scaled 20%)
 *  Exchange → Redis Streams → 3 Engines → Broker (+ fills back)
 * ──────────────────────────────────────────────────────────── */
const ANE_TOP = DIVIDER_Y + 60;
const ANE_MID_Y = ANE_TOP + (VB_H - ANE_TOP) / 2 - 12;

const ANE_EXCHANGE = { cx: 96, cy: ANE_MID_Y, w: 144, h: 84 };
const ANE_REDIS = { cx: 348, cy: ANE_MID_Y, w: 168, h: 168 };

const ENGINE_W = 312;
const ENGINE_H = 180;
const ENGINE_X = 648;
const ENGINE_GAP_Y = 19;

const ENGINES = [
  { label: "Engine 1", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + ENGINE_H / 2 },
  { label: "Engine 2", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + ENGINE_H + ENGINE_GAP_Y + ENGINE_H / 2 },
  { label: "Engine 3", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + 2 * (ENGINE_H + ENGINE_GAP_Y) + ENGINE_H / 2 },
];

/* Broker node — single box to the right of engines */
const BROKER = { cx: 1260, cy: ANE_MID_Y, w: 168, h: 120 };

/* ────────────────────────────────────────────────────────────
 *  Path builders
 * ──────────────────────────────────────────────────────────── */
function aneExchangeToRedis(): string {
  return bezierH(
    ANE_EXCHANGE.cx + ANE_EXCHANGE.w / 2, ANE_EXCHANGE.cy,
    ANE_REDIS.cx - ANE_REDIS.w / 2, ANE_REDIS.cy,
  );
}

function aneRedisToEngine(engineIdx: number): string {
  const eng = ENGINES[engineIdx];
  return bezierH(
    ANE_REDIS.cx + ANE_REDIS.w / 2, ANE_REDIS.cy,
    eng.cx - ENGINE_W / 2, eng.cy,
  );
}

function aneEngineToBroker(engineIdx: number): string {
  const eng = ENGINES[engineIdx];
  return bezierH(
    eng.cx + ENGINE_W / 2, eng.cy,
    BROKER.cx - BROKER.w / 2, BROKER.cy,
  );
}

function aneBrokerToEngine(engineIdx: number): string {
  /* Return path curves below/above the forward path */
  const eng = ENGINES[engineIdx];
  const x1 = BROKER.cx - BROKER.w / 2;
  const y1 = BROKER.cy + 36;
  const x2 = eng.cx + ENGINE_W / 2;
  const y2 = eng.cy + 24;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 36}, ${cpx} ${y2 + 36}, ${x2} ${y2}`;
}

/* ================================================================
 *  Main component
 * ================================================================ */
export function EngineFlowSlide({ active }: EngineFlowSlideProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const loopTlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!active) {
      revealTlRef.current?.pause(0);
      loopTlRef.current?.pause(0);
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    revealTlRef.current?.kill();
    loopTlRef.current?.kill();

    /* ──────── REVEAL TIMELINE (refined, subtle animations) ──────── */
    const reveal = gsap.timeline();
    revealTlRef.current = reveal;

    /* Set ALL paths invisible initially (fixes lines-before-boxes issue) */
    const tradPaths = svg.querySelectorAll<SVGPathElement>(".trad-path");
    const anePaths = svg.querySelectorAll<SVGPathElement>(".ane-path");
    const intPaths = svg.querySelectorAll<SVGPathElement>(".int-path");
    const retPaths = svg.querySelectorAll<SVGPathElement>(".ret-path");
    
    [tradPaths, anePaths, intPaths, retPaths].forEach(paths => {
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
      });
    });

    /* Title reveal */
    reveal.fromTo(
      titleRef.current,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" },
    );

    /* Row labels */
    const rowLabels = svg.querySelectorAll(".row-label");
    reveal.fromTo(
      rowLabels,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.12, ease: "power2.out" },
      "-=0.2",
    );

    /* Traditional nodes (boxes first, then lines) */
    const tradNodes = svg.querySelectorAll(".trad-node");
    reveal.fromTo(
      tradNodes,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" },
      "-=0.15",
    );

    /* Traditional paths (after nodes) */
    reveal.to(tradPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.5, stagger: 0.04, ease: "power1.inOut" });

    /* Missed marks */
    const missed = svg.querySelectorAll(".missed-mark");
    reveal.fromTo(
      missed,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.25, stagger: 0.06, transformOrigin: "center center", ease: "power2.out" },
      "-=0.15",
    );

    /* Traditional extras */
    const tradExtra = svg.querySelectorAll(".trad-extra");
    reveal.fromTo(
      tradExtra,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, stagger: 0.04 },
      "-=0.1",
    );

    /* Anekant nodes (boxes first) */
    const aneNodes = svg.querySelectorAll(".ane-node");
    reveal.fromTo(
      aneNodes,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" },
      "-=0.1",
    );

    /* Anekant paths (after nodes) */
    reveal.to(anePaths, { opacity: 0.4, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Engine internal items */
    const internalItems = svg.querySelectorAll(".engine-item");
    reveal.fromTo(
      internalItems,
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" },
      "-=0.3",
    );

    /* Internal paths */
    reveal.to(intPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.4, stagger: 0.02, ease: "power1.inOut" });

    /* Return paths */
    reveal.to(retPaths, { opacity: 0.3, strokeDashoffset: 0, duration: 0.5, stagger: 0.04, ease: "power1.inOut" });

    /* ──────── LOOPING DOT TIMELINE (starts after reveal completes) ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.3, paused: true });
    loopTlRef.current = loop;

    /* Start loop only after reveal finishes */
    reveal.eventCallback("onComplete", () => {
      loop.play();
    });

    /* — Traditional: slow crawl — */
    const tradDot = svg.querySelector<SVGCircleElement>(".trad-dot");
    if (tradDot) {
      const firstX = tradStepX(0);
      gsap.set(tradDot, { attr: { cx: firstX, cy: TRAD_Y }, opacity: 0 });
      loop.to(tradDot, { opacity: 1, duration: 0.15 }, 0);
      let t = 0.15;
      for (let i = 1; i < TRAD_STEPS.length; i++) {
        loop.to(tradDot, { attr: { cx: tradStepX(i) }, duration: 0.7, ease: "power1.inOut" }, `${t}`);
        t += 0.7 + 0.5;
      }
      loop.to(tradDot, { opacity: 0, duration: 0.2 }, `${t}`);
    }

    /* — Anekant: fast parallel flow — */
    /* Wave 1: Exchange → Redis */
    const p1 = svg.querySelector<SVGPathElement>(".ane-path-ex-redis");
    const d1 = svg.querySelector<SVGCircleElement>(".ane-dot-ex-redis");
    if (p1 && d1) animateDot(d1, p1, loop, 0.5, 0);

    /* Wave 2: Redis → Engines */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.ane-path-r2e-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.ane-dot-r2e-${i}`);
      if (p && d) animateDot(d, p, loop, 0.4, 0.35 + i * 0.04);
    }

    /* Wave 3: Internal fan-out */
    for (let e = 0; e < 3; e++) {
      for (let item = 0; item < ENGINE_ITEM_COUNT; item++) {
        const p = svg.querySelector<SVGPathElement>(`.int-path-${e}-${item}`);
        const d = svg.querySelector<SVGCircleElement>(`.int-dot-${e}-${item}`);
        if (p && d) animateDot(d, p, loop, 0.3, 0.65 + e * 0.04 + item * 0.02);
      }
    }

    /* Checkmarks - subtle fade with scale */
    const checks = svg.querySelectorAll<SVGElement>(".engine-check");
    loop.fromTo(
      checks,
      { opacity: 0, scale: 0.8, transformOrigin: "center center" },
      { opacity: 1, scale: 1, duration: 0.2, stagger: 0.03, ease: "power2.out" },
      0.95,
    );
    loop.to(checks, { opacity: 0, duration: 0.25 }, "+=0.35");

    /* Wave 4: Engines → Broker (orders out) */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.ane-path-e2b-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.ane-dot-e2b-${i}`);
      if (p && d) animateDot(d, p, loop, 0.35, 1.1 + i * 0.04);
    }

    /* Wave 5: Broker → Engines (fills back — reverse direction) */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.ret-path-b2e-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.ret-dot-b2e-${i}`);
      if (p && d) animateDotReverse(d, p, loop, 0.35, 1.55 + i * 0.04);
    }

    /* Pad so both rows visible before repeating */
    const totalTradTime = 0.15 + (TRAD_STEPS.length - 1) * (0.7 + 0.5) + 0.2;
    loop.to({}, { duration: Math.max(0, totalTradTime - loop.duration()) });

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-8">
      <div ref={titleRef} className="mb-4 text-center opacity-0">
        <h2
          className="text-5xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          How a Tick Reaches Your Strategy
        </h2>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1560px", maxHeight: "calc(100vh - 140px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <StandardDefs />
        </defs>

        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ DIVIDER ═══════════ */}
        <line
          x1={48} y1={DIVIDER_Y} x2={VB_W - 48} y2={DIVIDER_Y}
          stroke="var(--border-subtle)" strokeWidth={1.2} strokeDasharray="10 7" opacity={0.6}
        />

        {/* Contrast labels near divider */}
        <text
          x={VB_W / 2 - 216} y={DIVIDER_Y - 10}
          textAnchor="middle" className="text-[12px] italic font-medium" fill="var(--accent-red)" opacity={0.7}
        >
          1 tick at a time
        </text>
        <text
          x={VB_W / 2 + 216} y={DIVIDER_Y + 22}
          textAnchor="middle" className="text-[12px] italic font-medium" fill="var(--accent-amber)" opacity={0.7}
        >
          All ticks, all engines, in parallel
        </text>

        {/* ═══════════ ROW LABELS ═══════════ */}
        <g className="row-label" style={{ opacity: 0 }}>
          <rect
            x={36} y={72} width={180} height={34} rx={7}
            fill="color-mix(in srgb, var(--accent-red) 14%, transparent)"
            stroke="var(--accent-red)" strokeWidth={1} opacity={0.8}
          />
          <text x={126} y={95} textAnchor="middle" className="text-[14px] font-bold uppercase tracking-wider" fill="var(--accent-red)">
            Traditional
          </text>
        </g>

        <g className="row-label" style={{ opacity: 0 }}>
          <rect
            x={36} y={DIVIDER_Y + 17} width={204} height={34} rx={7}
            fill="color-mix(in srgb, var(--accent-amber) 14%, transparent)"
            stroke="var(--accent-amber)" strokeWidth={1} opacity={0.8}
          />
          <text x={138} y={DIVIDER_Y + 40} textAnchor="middle" className="text-[14px] font-bold uppercase tracking-wider" fill="var(--accent-amber)">
            Anekant Engine
          </text>
        </g>

        {/* ═══════════ TRADITIONAL ROW ═══════════ */}

        {/* Step boxes */}
        {TRAD_STEPS.map((step, i) => {
          const cx = tradStepX(i);
          return (
            <g key={`trad-${i}`} className="trad-node" style={{ opacity: 0 }}>
              <rect
                x={cx - TRAD_BOX_W / 2} y={TRAD_Y - TRAD_BOX_H / 2}
                width={TRAD_BOX_W} height={TRAD_BOX_H} rx={12}
                fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} opacity={0.8}
              />
              <text x={cx} y={TRAD_Y + 6} textAnchor="middle" className="text-[15px] font-semibold" fill="var(--accent-red)">
                {step.label}
              </text>
            </g>
          );
        })}

        {/* Connecting paths */}
        {TRAD_STEPS.slice(0, -1).map((_, i) => (
          <path
            key={`tp-${i}`} d={tradPath(i, i + 1)} className="trad-path"
            fill="none" stroke="var(--accent-red)" strokeWidth={1.8} opacity={0.35} strokeDasharray="6 5"
          />
        ))}

        {/* Slow dot */}
        <circle className="trad-dot" r={7} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />

        {/* Tick pile-up indicator (left side — stacked bars) */}
        <g className="trad-extra" style={{ opacity: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const bx = tradStepX(0) - TRAD_BOX_W / 2 - 60;
            const by = TRAD_Y - 22 + i * 10;
            return (
              <rect
                key={`pile-${i}`}
                x={bx} y={by} width={34} height={6} rx={2}
                fill="var(--accent-red)" opacity={0.18 + i * 0.14}
              />
            );
          })}
          <text
            x={tradStepX(0) - TRAD_BOX_W / 2 - 43}
            y={TRAD_Y + 41}
            textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-red)" opacity={0.7}
          >
            ticks pile up
          </text>
        </g>

        {/* Missed-tick X marks */}
        {[1, 3].map((stepIdx) => {
          const cx = tradStepX(stepIdx);
          const mx = cx + TRAD_BOX_W / 2 + 26;
          const my = TRAD_Y;
          return (
            <g key={`miss-${stepIdx}`} className="missed-mark" style={{ opacity: 0 }}>
              <line x1={mx - 8} y1={my - 8} x2={mx + 8} y2={my + 8} stroke="var(--accent-red)" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
              <line x1={mx + 8} y1={my - 8} x2={mx - 8} y2={my + 8} stroke="var(--accent-red)" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
              <text x={mx} y={my + 26} textAnchor="middle" className="text-[12px] font-medium" fill="var(--accent-red)" opacity={0.8}>
                missed
              </text>
            </g>
          );
        })}

        {/* "wait…" labels */}
        {[1, 2, 3].map((i) => {
          const x1 = tradStepX(i) + TRAD_BOX_W / 2;
          const x2 = tradStepX(i + 1) - TRAD_BOX_W / 2;
          return (
            <text key={`wait-${i}`} x={(x1 + x2) / 2} y={TRAD_Y + 38} textAnchor="middle" className="text-[12px] italic" fill="var(--text-muted)" opacity={0.6}>
              wait…
            </text>
          );
        })}

        {/* Cycle time label */}
        <text
          x={tradStepX(2)} y={TRAD_Y + 58}
          textAnchor="middle" className="trad-extra text-[13px] font-semibold" fill="var(--accent-red)" opacity={0}
        >
          ~5s per cycle
        </text>

        {/* ═══════════ ANEKANT ROW ═══════════ */}

        {/* Exchange node */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect
            x={ANE_EXCHANGE.cx - ANE_EXCHANGE.w / 2} y={ANE_EXCHANGE.cy - ANE_EXCHANGE.h / 2}
            width={ANE_EXCHANGE.w} height={ANE_EXCHANGE.h} rx={14}
            fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4}
          />
          <text x={ANE_EXCHANGE.cx} y={ANE_EXCHANGE.cy - 7} textAnchor="middle" className="text-[17px] font-bold" fill="var(--text-primary)">
            Exchange
          </text>
          <text x={ANE_EXCHANGE.cx} y={ANE_EXCHANGE.cy + 17} textAnchor="middle" className="text-[13px]" fill="var(--text-muted)">
            NSE / BSE
          </text>
        </g>

        {/* Redis Streams */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect
            x={ANE_REDIS.cx - ANE_REDIS.w / 2} y={ANE_REDIS.cy - ANE_REDIS.h / 2}
            width={ANE_REDIS.w} height={ANE_REDIS.h} rx={14}
            fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4}
          />
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy - 22} textAnchor="middle" className="text-[17px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy + 2} textAnchor="middle" className="text-[17px] font-bold" fill="var(--text-primary)">Streams</text>
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy + 29} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">real-time bus</text>
        </g>

        {/* Exchange → Redis path */}
        <path d={aneExchangeToRedis()} className="ane-path ane-path-ex-redis" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />

        {/* Redis → Engine paths */}
        {ENGINES.map((_, i) => (
          <path key={`r2e-${i}`} d={aneRedisToEngine(i)} className={`ane-path ane-path-r2e-${i}`} fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />
        ))}

        {/* Engine boxes */}
        {ENGINES.map((eng, eIdx) => (
          <EngineBox
            key={eng.label}
            cx={eng.cx} cy={eng.cy} w={ENGINE_W} h={ENGINE_H}
            label={eng.label} engineIdx={eIdx}
          />
        ))}

        {/* Engine → Broker paths (forward: orders) */}
        {ENGINES.map((_, i) => (
          <path key={`e2b-${i}`} d={aneEngineToBroker(i)} className={`ane-path ane-path-e2b-${i}`} fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.35} />
        ))}

        {/* "Orders" label on forward path */}
        <text
          x={(ENGINES[0].cx + ENGINE_W / 2 + BROKER.cx - BROKER.w / 2) / 2}
          y={ENGINES[0].cy - 22}
          textAnchor="middle" className="ane-node text-[12px] font-semibold" fill="var(--accent-coral)" opacity={0}
        >
          Orders
        </text>

        {/* Broker node */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect
            x={BROKER.cx - BROKER.w / 2} y={BROKER.cy - BROKER.h / 2}
            width={BROKER.w} height={BROKER.h} rx={14}
            fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4}
          />
          <text x={BROKER.cx} y={BROKER.cy - 12} textAnchor="middle" className="text-[17px] font-bold" fill="var(--text-primary)">
            Broker
          </text>
          <text x={BROKER.cx} y={BROKER.cy + 12} textAnchor="middle" className="text-[13px]" fill="var(--text-muted)">
            Kite / XTS
          </text>
          <text x={BROKER.cx} y={BROKER.cy + 34} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">
            order execution
          </text>
        </g>

        {/* Broker → Engine return paths (fills back) */}
        {ENGINES.map((_, i) => (
          <path key={`b2e-${i}`} d={aneBrokerToEngine(i)} className={`ane-path ret-path ret-path-b2e-${i}`} fill="none" stroke="var(--accent-emerald)" strokeWidth={1.4} opacity={0.3} strokeDasharray="7 5" />
        ))}

        {/* "Fills" label on return path */}
        <text
          x={(ENGINES[2].cx + ENGINE_W / 2 + BROKER.cx - BROKER.w / 2) / 2}
          y={ENGINES[2].cy + ENGINE_H / 2 + 36}
          textAnchor="middle" className="ane-node text-[12px] font-semibold" fill="var(--accent-emerald)" opacity={0}
        >
          Fills
        </text>

        {/* ═══════════ FLOW DOTS ═══════════ */}

        {/* Exchange → Redis */}
        <circle className="ane-dot-ex-redis" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />

        {/* Redis → Engines */}
        {ENGINES.map((_, i) => (
          <circle key={`rd-${i}`} className={`ane-dot-r2e-${i}`} r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        ))}

        {/* Internal fan-out */}
        {ENGINES.map((_, eIdx) =>
          ENGINE_ITEMS.map((_, iIdx) => (
            <circle key={`id-${eIdx}-${iIdx}`} className={`int-dot-${eIdx}-${iIdx}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
          )),
        )}

        {/* Engine → Broker (order dots) */}
        {ENGINES.map((_, i) => (
          <circle key={`od-${i}`} className={`ane-dot-e2b-${i}`} r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        ))}

        {/* Broker → Engine (fill dots — travel in reverse) */}
        {ENGINES.map((_, i) => (
          <circle key={`fd-${i}`} className={`ret-dot-b2e-${i}`} r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}

        {/* ═══════════ ZONE LABELS ═══════════ */}
        <text x={ANE_EXCHANGE.cx} y={VB_H - 10} textAnchor="middle" className="text-[12px] uppercase tracking-widest font-medium" fill="var(--text-muted)" opacity={0.5}>Market</text>
        <text x={ANE_REDIS.cx} y={VB_H - 10} textAnchor="middle" className="text-[12px] uppercase tracking-widest font-medium" fill="var(--text-muted)" opacity={0.5}>Message Bus</text>
        <text x={ENGINES[1].cx} y={VB_H - 10} textAnchor="middle" className="text-[12px] uppercase tracking-widest font-medium" fill="var(--text-muted)" opacity={0.5}>Engines</text>
        <text x={BROKER.cx} y={VB_H - 10} textAnchor="middle" className="text-[12px] uppercase tracking-widest font-medium" fill="var(--text-muted)" opacity={0.5}>Execution</text>
      </svg>
    </SlideLayout>
  );
}
