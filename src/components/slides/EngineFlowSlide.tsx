import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, itemX, itemY, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  EngineFlowSlide
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
 *  TRADITIONAL ROW — top
 * ──────────────────────────────────────────────────────────── */
const DIVIDER_Y = 230;
const TRAD_Y = 140;
const TRAD_BOX_W = 160;
const TRAD_BOX_H = 48;
const TRAD_GAP = 50;

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
 *  ANEKANT ROW — bottom
 *  Exchange → Redis Streams → 3 Engines → Broker (+ fills back)
 * ──────────────────────────────────────────────────────────── */
const ANE_TOP = DIVIDER_Y + 50;
const ANE_MID_Y = ANE_TOP + (VB_H - ANE_TOP) / 2 - 10;

const ANE_EXCHANGE = { cx: 80, cy: ANE_MID_Y, w: 120, h: 70 };
const ANE_REDIS = { cx: 290, cy: ANE_MID_Y, w: 140, h: 140 };

const ENGINE_W = 260;
const ENGINE_H = 150;
const ENGINE_X = 540;
const ENGINE_GAP_Y = 16;

const ENGINES = [
  { label: "Engine 1", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + ENGINE_H / 2 },
  { label: "Engine 2", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + ENGINE_H + ENGINE_GAP_Y + ENGINE_H / 2 },
  { label: "Engine 3", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + 2 * (ENGINE_H + ENGINE_GAP_Y) + ENGINE_H / 2 },
];

/* Broker node — single box to the right of engines */
const BROKER = { cx: 1050, cy: ANE_MID_Y, w: 140, h: 100 };

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
  const y1 = BROKER.cy + 30;
  const x2 = eng.cx + ENGINE_W / 2;
  const y2 = eng.cy + 20;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 30}, ${cpx} ${y2 + 30}, ${x2} ${y2}`;
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
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" },
    );

    /* Row labels */
    const rowLabels = svg.querySelectorAll(".row-label");
    reveal.fromTo(
      rowLabels,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.12, ease: "power2.out" },
      "-=0.2",
    );

    /* Traditional nodes (boxes first, then lines) */
    const tradNodes = svg.querySelectorAll(".trad-node");
    reveal.fromTo(
      tradNodes,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" },
      "-=0.15",
    );

    /* Traditional paths (after nodes) */
    reveal.to(tradPaths, { opacity: 0.3, strokeDashoffset: 0, duration: 0.5, stagger: 0.04, ease: "power1.inOut" });

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
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" },
      "-=0.1",
    );

    /* Anekant paths (after nodes) */
    reveal.to(anePaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Engine internal items */
    const internalItems = svg.querySelectorAll(".engine-item");
    reveal.fromTo(
      internalItems,
      { opacity: 0, x: -6 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" },
      "-=0.3",
    );

    /* Internal paths */
    reveal.to(intPaths, { opacity: 0.3, strokeDashoffset: 0, duration: 0.4, stagger: 0.02, ease: "power1.inOut" });

    /* Return paths */
    reveal.to(retPaths, { opacity: 0.25, strokeDashoffset: 0, duration: 0.5, stagger: 0.04, ease: "power1.inOut" });

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
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          How a Tick Reaches Your Strategy
        </h2>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1300px", maxHeight: "calc(100vh - 120px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <StandardDefs />
        </defs>

        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ DIVIDER ═══════════ */}
        <line
          x1={40} y1={DIVIDER_Y} x2={VB_W - 40} y2={DIVIDER_Y}
          stroke="var(--border-subtle)" strokeWidth={1} strokeDasharray="8 6" opacity={0.5}
        />

        {/* Contrast labels near divider */}
        <text
          x={VB_W / 2 - 180} y={DIVIDER_Y - 8}
          textAnchor="middle" className="text-[10px] italic" fill="var(--accent-red)" opacity={0.6}
        >
          1 tick at a time
        </text>
        <text
          x={VB_W / 2 + 180} y={DIVIDER_Y + 18}
          textAnchor="middle" className="text-[10px] italic" fill="var(--accent-cyan)" opacity={0.6}
        >
          All ticks, all engines, in parallel
        </text>

        {/* ═══════════ ROW LABELS ═══════════ */}
        <g className="row-label" style={{ opacity: 0 }}>
          <rect
            x={30} y={60} width={150} height={28} rx={6}
            fill="color-mix(in srgb, var(--accent-red) 12%, transparent)"
            stroke="var(--accent-red)" strokeWidth={0.8} opacity={0.7}
          />
          <text x={105} y={79} textAnchor="middle" className="text-[12px] font-bold uppercase tracking-wider" fill="var(--accent-red)">
            Traditional
          </text>
        </g>

        <g className="row-label" style={{ opacity: 0 }}>
          <rect
            x={30} y={DIVIDER_Y + 14} width={170} height={28} rx={6}
            fill="color-mix(in srgb, var(--accent-cyan) 12%, transparent)"
            stroke="var(--accent-cyan)" strokeWidth={0.8} opacity={0.7}
          />
          <text x={115} y={DIVIDER_Y + 33} textAnchor="middle" className="text-[12px] font-bold uppercase tracking-wider" fill="var(--accent-cyan)">
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
                width={TRAD_BOX_W} height={TRAD_BOX_H} rx={10}
                fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1} opacity={0.7}
              />
              <text x={cx} y={TRAD_Y + 5} textAnchor="middle" className="text-[13px] font-semibold" fill="var(--accent-red)">
                {step.label}
              </text>
            </g>
          );
        })}

        {/* Connecting paths */}
        {TRAD_STEPS.slice(0, -1).map((_, i) => (
          <path
            key={`tp-${i}`} d={tradPath(i, i + 1)} className="trad-path"
            fill="none" stroke="var(--accent-red)" strokeWidth={1.5} opacity={0.3} strokeDasharray="5 4"
          />
        ))}

        {/* Slow dot */}
        <circle className="trad-dot" r={6} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />

        {/* Tick pile-up indicator (left side — stacked bars) */}
        <g className="trad-extra" style={{ opacity: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const bx = tradStepX(0) - TRAD_BOX_W / 2 - 50;
            const by = TRAD_Y - 18 + i * 8;
            return (
              <rect
                key={`pile-${i}`}
                x={bx} y={by} width={28} height={5} rx={2}
                fill="var(--accent-red)" opacity={0.15 + i * 0.12}
              />
            );
          })}
          <text
            x={tradStepX(0) - TRAD_BOX_W / 2 - 36}
            y={TRAD_Y + 34}
            textAnchor="middle" className="text-[9px]" fill="var(--accent-red)" opacity={0.6}
          >
            ticks pile up
          </text>
        </g>

        {/* Missed-tick X marks */}
        {[1, 3].map((stepIdx) => {
          const cx = tradStepX(stepIdx);
          const mx = cx + TRAD_BOX_W / 2 + 22;
          const my = TRAD_Y;
          return (
            <g key={`miss-${stepIdx}`} className="missed-mark" style={{ opacity: 0 }}>
              <line x1={mx - 7} y1={my - 7} x2={mx + 7} y2={my + 7} stroke="var(--accent-red)" strokeWidth={2.5} opacity={0.6} strokeLinecap="round" />
              <line x1={mx + 7} y1={my - 7} x2={mx - 7} y2={my + 7} stroke="var(--accent-red)" strokeWidth={2.5} opacity={0.6} strokeLinecap="round" />
              <text x={mx} y={my + 22} textAnchor="middle" className="text-[10px]" fill="var(--accent-red)" opacity={0.7}>
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
            <text key={`wait-${i}`} x={(x1 + x2) / 2} y={TRAD_Y + 32} textAnchor="middle" className="text-[10px] italic" fill="var(--text-muted)" opacity={0.5}>
              wait…
            </text>
          );
        })}

        {/* Cycle time label */}
        <text
          x={tradStepX(2)} y={TRAD_Y + 48}
          textAnchor="middle" className="trad-extra text-[11px] font-semibold" fill="var(--accent-red)" opacity={0}
        >
          ~5s per cycle
        </text>

        {/* ═══════════ ANEKANT ROW ═══════════ */}

        {/* Exchange node */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect
            x={ANE_EXCHANGE.cx - ANE_EXCHANGE.w / 2} y={ANE_EXCHANGE.cy - ANE_EXCHANGE.h / 2}
            width={ANE_EXCHANGE.w} height={ANE_EXCHANGE.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.2}
          />
          <text x={ANE_EXCHANGE.cx} y={ANE_EXCHANGE.cy - 6} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">
            Exchange
          </text>
          <text x={ANE_EXCHANGE.cx} y={ANE_EXCHANGE.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">
            NSE / BSE
          </text>
        </g>

        {/* Redis Streams */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect
            x={ANE_REDIS.cx - ANE_REDIS.w / 2} y={ANE_REDIS.cy - ANE_REDIS.h / 2}
            width={ANE_REDIS.w} height={ANE_REDIS.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2}
          />
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy - 18} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy + 2} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Streams</text>
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy + 24} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">real-time bus</text>
        </g>

        {/* Exchange → Redis path */}
        <path d={aneExchangeToRedis()} className="ane-path ane-path-ex-redis" fill="none" stroke="var(--accent-cyan)" strokeWidth={2} opacity={0.35} />

        {/* Redis → Engine paths */}
        {ENGINES.map((_, i) => (
          <path key={`r2e-${i}`} d={aneRedisToEngine(i)} className={`ane-path ane-path-r2e-${i}`} fill="none" stroke="var(--accent-cyan)" strokeWidth={2} opacity={0.35} />
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
          <path key={`e2b-${i}`} d={aneEngineToBroker(i)} className={`ane-path ane-path-e2b-${i}`} fill="none" stroke="var(--accent-purple)" strokeWidth={1.5} opacity={0.3} />
        ))}

        {/* "Orders" label on forward path */}
        <text
          x={(ENGINES[0].cx + ENGINE_W / 2 + BROKER.cx - BROKER.w / 2) / 2}
          y={ENGINES[0].cy - 18}
          textAnchor="middle" className="ane-node text-[10px] font-medium" fill="var(--accent-purple)" opacity={0}
        >
          Orders
        </text>

        {/* Broker node */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect
            x={BROKER.cx - BROKER.w / 2} y={BROKER.cy - BROKER.h / 2}
            width={BROKER.w} height={BROKER.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.2}
          />
          <text x={BROKER.cx} y={BROKER.cy - 10} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">
            Broker
          </text>
          <text x={BROKER.cx} y={BROKER.cy + 10} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">
            Kite / XTS
          </text>
          <text x={BROKER.cx} y={BROKER.cy + 28} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">
            order execution
          </text>
        </g>

        {/* Broker → Engine return paths (fills back) */}
        {ENGINES.map((_, i) => (
          <path key={`b2e-${i}`} d={aneBrokerToEngine(i)} className={`ane-path ret-path ret-path-b2e-${i}`} fill="none" stroke="var(--accent-green)" strokeWidth={1.2} opacity={0.25} strokeDasharray="6 4" />
        ))}

        {/* "Fills" label on return path */}
        <text
          x={(ENGINES[2].cx + ENGINE_W / 2 + BROKER.cx - BROKER.w / 2) / 2}
          y={ENGINES[2].cy + ENGINE_H / 2 + 30}
          textAnchor="middle" className="ane-node text-[10px] font-medium" fill="var(--accent-green)" opacity={0}
        >
          Fills
        </text>

        {/* ═══════════ FLOW DOTS ═══════════ */}

        {/* Exchange → Redis */}
        <circle className="ane-dot-ex-redis" r={5} fill="var(--accent-cyan)" opacity={0} filter="url(#glowCyan)" />

        {/* Redis → Engines */}
        {ENGINES.map((_, i) => (
          <circle key={`rd-${i}`} className={`ane-dot-r2e-${i}`} r={5} fill="var(--accent-cyan)" opacity={0} filter="url(#glowCyan)" />
        ))}

        {/* Internal fan-out */}
        {ENGINES.map((_, eIdx) =>
          ENGINE_ITEMS.map((_, iIdx) => (
            <circle key={`id-${eIdx}-${iIdx}`} className={`int-dot-${eIdx}-${iIdx}`} r={3} fill="var(--accent-green)" opacity={0} filter="url(#glowGreen)" />
          )),
        )}

        {/* Engine → Broker (order dots) */}
        {ENGINES.map((_, i) => (
          <circle key={`od-${i}`} className={`ane-dot-e2b-${i}`} r={4} fill="var(--accent-purple)" opacity={0} filter="url(#glowPurple)" />
        ))}

        {/* Broker → Engine (fill dots — travel in reverse) */}
        {ENGINES.map((_, i) => (
          <circle key={`fd-${i}`} className={`ret-dot-b2e-${i}`} r={4} fill="var(--accent-green)" opacity={0} filter="url(#glowGreen)" />
        ))}

        {/* ═══════════ ZONE LABELS ═══════════ */}
        <text x={ANE_EXCHANGE.cx} y={VB_H - 8} textAnchor="middle" className="text-[10px] uppercase tracking-widest" fill="var(--text-muted)" opacity={0.4}>Market</text>
        <text x={ANE_REDIS.cx} y={VB_H - 8} textAnchor="middle" className="text-[10px] uppercase tracking-widest" fill="var(--text-muted)" opacity={0.4}>Message Bus</text>
        <text x={ENGINES[1].cx} y={VB_H - 8} textAnchor="middle" className="text-[10px] uppercase tracking-widest" fill="var(--text-muted)" opacity={0.4}>Engines</text>
        <text x={BROKER.cx} y={VB_H - 8} textAnchor="middle" className="text-[10px] uppercase tracking-widest" fill="var(--text-muted)" opacity={0.4}>Execution</text>
      </svg>
    </SlideLayout>
  );
}
