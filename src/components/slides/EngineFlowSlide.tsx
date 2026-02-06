import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  EngineFlowSlide - Redesigned for Speed & Architecture Comparison
 *
 *  Two-row comparison - APPLES TO APPLES:
 *    Top (~30%): Traditional BLOCKING approach - complete flow with Broker
 *    Bottom (~70%): Anekant ASYNC approach - 3 parallel engines
 * ================================================================ */

interface EngineFlowSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  TRADITIONAL ROW — Complete blocking flow
 * ──────────────────────────────────────────────────────────── */
const DIVIDER_Y = 290;
const TRAD_Y = 160;
const TRAD_BOX_H = 58;
const TRAD_BOX_W = 120;

const TRAD_EXCHANGE = { cx: 100, cy: TRAD_Y, w: 110, h: TRAD_BOX_H };
const TRAD_POLL = { cx: 235, cy: TRAD_Y, w: TRAD_BOX_W, h: TRAD_BOX_H };
const TRAD_CANDLES = { cx: 370, cy: TRAD_Y, w: TRAD_BOX_W, h: TRAD_BOX_H };
const TRAD_INDICATORS = { cx: 505, cy: TRAD_Y, w: TRAD_BOX_W, h: TRAD_BOX_H };
const TRAD_STRATEGY = { cx: 640, cy: TRAD_Y, w: TRAD_BOX_W, h: TRAD_BOX_H };
const TRAD_ORDER = { cx: 775, cy: TRAD_Y, w: TRAD_BOX_W, h: TRAD_BOX_H };
const TRAD_BROKER = { cx: 910, cy: TRAD_Y, w: 110, h: TRAD_BOX_H };

const WAIT_POSITIONS = [
  { x: (TRAD_POLL.cx + TRAD_CANDLES.cx) / 2, y: TRAD_Y + 40 },
  { x: (TRAD_CANDLES.cx + TRAD_INDICATORS.cx) / 2, y: TRAD_Y + 40 },
  { x: (TRAD_INDICATORS.cx + TRAD_STRATEGY.cx) / 2, y: TRAD_Y + 40 },
  { x: (TRAD_STRATEGY.cx + TRAD_ORDER.cx) / 2, y: TRAD_Y + 40 },
];

/* ────────────────────────────────────────────────────────────
 *  ANEKANT ROW — 3 Parallel Engines
 * ──────────────────────────────────────────────────────────── */
const ANE_TOP = DIVIDER_Y + 50;
const ANE_MID_Y = ANE_TOP + (VB_H - ANE_TOP) / 2 - 12;

const ANE_EXCHANGE = { cx: 96, cy: ANE_MID_Y, w: 140, h: 84 };
const ANE_REDIS = { cx: 320, cy: ANE_MID_Y, w: 160, h: 160 };

const ENGINE_W = 300;
const ENGINE_H = 175;
const ENGINE_X = 600;
const ENGINE_GAP_Y = 18;

const ENGINES = [
  { label: "Engine 1", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + ENGINE_H / 2 },
  { label: "Engine 2", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + ENGINE_H + ENGINE_GAP_Y + ENGINE_H / 2 },
  { label: "Engine 3", cx: ENGINE_X + ENGINE_W / 2, cy: ANE_TOP + 2 * (ENGINE_H + ENGINE_GAP_Y) + ENGINE_H / 2 },
];

const ANE_BROKER = { cx: 1200, cy: ANE_MID_Y, w: 150, h: 110 };

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function tradPath(from: { cx: number; w: number }, to: { cx: number; w: number }): string {
  return `M ${from.cx + from.w / 2} ${TRAD_Y} L ${to.cx - to.w / 2} ${TRAD_Y}`;
}

function aneExchangeToRedis(): string {
  return bezierH(ANE_EXCHANGE.cx + ANE_EXCHANGE.w / 2, ANE_EXCHANGE.cy, ANE_REDIS.cx - ANE_REDIS.w / 2, ANE_REDIS.cy);
}

function aneRedisToEngine(engineIdx: number): string {
  const eng = ENGINES[engineIdx];
  return bezierH(ANE_REDIS.cx + ANE_REDIS.w / 2, ANE_REDIS.cy, eng.cx - ENGINE_W / 2, eng.cy);
}

function aneEngineToBroker(engineIdx: number): string {
  const eng = ENGINES[engineIdx];
  return bezierH(eng.cx + ENGINE_W / 2, eng.cy, ANE_BROKER.cx - ANE_BROKER.w / 2, ANE_BROKER.cy);
}

function aneBrokerToEngine(engineIdx: number): string {
  const eng = ENGINES[engineIdx];
  const x1 = ANE_BROKER.cx - ANE_BROKER.w / 2;
  const y1 = ANE_BROKER.cy + 32;
  const x2 = eng.cx + ENGINE_W / 2;
  const y2 = eng.cy + 24;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 32}, ${cpx} ${y2 + 32}, ${x2} ${y2}`;
}

/* ================================================================
 *  COMPONENT
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

    /* ──────── REVEAL TIMELINE ──────── */
    const reveal = gsap.timeline();
    revealTlRef.current = reveal;

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

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    const rowLabels = svg.querySelectorAll(".row-label");
    reveal.fromTo(rowLabels, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.12, ease: "power2.out" }, "-=0.2");

    const tradNodes = svg.querySelectorAll(".trad-node");
    reveal.fromTo(tradNodes, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }, "-=0.15");

    reveal.to(tradPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.5, stagger: 0.03, ease: "power1.inOut" });

    const waitIndicators = svg.querySelectorAll(".wait-indicator");
    reveal.fromTo(waitIndicators, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.05 }, "-=0.2");

    const aneNodes = svg.querySelectorAll(".ane-node");
    reveal.fromTo(aneNodes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }, "-=0.1");

    reveal.to(anePaths, { opacity: 0.4, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    const internalItems = svg.querySelectorAll(".engine-item");
    reveal.fromTo(internalItems, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" }, "-=0.3");

    reveal.to(intPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.4, stagger: 0.02, ease: "power1.inOut" });
    reveal.to(retPaths, { opacity: 0.3, strokeDashoffset: 0, duration: 0.5, stagger: 0.04, ease: "power1.inOut" });

    /* Timing callouts - reveal and keep visible */
    const timingCallouts = svg.querySelectorAll(".timing-callout");
    reveal.fromTo(timingCallouts, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out" }, "-=0.2");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.3, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* ═══ TRADITIONAL: Slow blocking flow ═══ */
    const tradDot = svg.querySelector<SVGCircleElement>(".trad-dot");
    const tradPathEls = [
      svg.querySelector<SVGPathElement>(".trad-path-0"),
      svg.querySelector<SVGPathElement>(".trad-path-1"),
      svg.querySelector<SVGPathElement>(".trad-path-2"),
      svg.querySelector<SVGPathElement>(".trad-path-3"),
      svg.querySelector<SVGPathElement>(".trad-path-4"),
      svg.querySelector<SVGPathElement>(".trad-path-5"),
    ];

    if (tradDot && tradPathEls.every(p => p)) {
      let tradTime = 0;
      const stepDuration = 0.6;
      const waitDuration = 0.35;

      loop.fromTo(tradDot, { opacity: 0 }, { opacity: 0.9, duration: 0.15 }, tradTime);
      tradTime += 0.15;

      tradPathEls.forEach((path, i) => {
        if (!path) return;
        const len = path.getTotalLength();

        loop.to(tradDot, {
          duration: stepDuration,
          ease: "power1.inOut",
          onUpdate() {
            const progress = this.progress();
            const pt = path.getPointAtLength(progress * len);
            gsap.set(tradDot, { attr: { cx: pt.x, cy: pt.y } });
          },
        }, tradTime);
        tradTime += stepDuration;

        if (i < WAIT_POSITIONS.length) {
          const waitEl = svg.querySelector(`.wait-indicator-${i}`);
          if (waitEl) {
            loop.to(waitEl, { scale: 1.15, transformOrigin: "center center", duration: 0.12 }, tradTime - 0.1);
            loop.to(waitEl, { scale: 1, duration: 0.12 }, tradTime + 0.02);
          }
          tradTime += waitDuration;
        }
      });

      loop.to(tradDot, { opacity: 0, duration: 0.15 }, tradTime);
    }

    /* ═══ ANEKANT: Fast parallel flow ═══ */
    
    /* Exchange → Redis */
    const p1 = svg.querySelector<SVGPathElement>(".ane-path-ex-redis");
    const d1 = svg.querySelector<SVGCircleElement>(".ane-dot-ex-redis");
    if (p1 && d1) animateDot(d1, p1, loop, 0.5, 0);

    /* Redis → Engines (parallel) */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.ane-path-r2e-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.ane-dot-r2e-${i}`);
      if (p && d) animateDot(d, p, loop, 0.4, 0.35 + i * 0.04);
    }

    /* Internal fan-out (all 3 engines in parallel) */
    for (let e = 0; e < 3; e++) {
      for (let item = 0; item < ENGINE_ITEM_COUNT; item++) {
        const p = svg.querySelector<SVGPathElement>(`.int-path-${e}-${item}`);
        const d = svg.querySelector<SVGCircleElement>(`.int-dot-${e}-${item}`);
        if (p && d) animateDot(d, p, loop, 0.3, 0.65 + e * 0.04 + item * 0.02);
      }
    }

    /* Checkmarks */
    const checks = svg.querySelectorAll<SVGElement>(".engine-check");
    loop.fromTo(checks, { opacity: 0, scale: 0.8, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.2, stagger: 0.03, ease: "power2.out" }, 0.95);
    loop.to(checks, { opacity: 0, duration: 0.25 }, "+=0.35");

    /* Engines → Broker (parallel) */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.ane-path-e2b-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.ane-dot-e2b-${i}`);
      if (p && d) animateDot(d, p, loop, 0.35, 1.1 + i * 0.04);
    }

    /* Broker → Engines (fills back) */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.ret-path-b2e-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.ret-dot-b2e-${i}`);
      if (p && d) animateDotReverse(d, p, loop, 0.35, 1.55 + i * 0.04);
    }

    /* Pad to sync with traditional timing */
    const totalTradTime = 5.5;
    loop.to({}, { duration: Math.max(0, totalTradTime - loop.duration()) });

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Speed Matters: Async vs Blocking
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          3-5 seconds vs sub-millisecond tick processing
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1560px", maxHeight: "calc(100vh - 140px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs><StandardDefs /></defs>
        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ DIVIDER ═══════════ */}
        <line x1={48} y1={DIVIDER_Y} x2={VB_W - 48} y2={DIVIDER_Y} stroke="var(--border-subtle)" strokeWidth={1.2} strokeDasharray="10 7" opacity={0.6} />

        {/* ═══════════ ROW LABELS ═══════════ */}
        <g className="row-label" style={{ opacity: 0 }}>
          <rect x={36} y={62} width={300} height={34} rx={7} fill="color-mix(in srgb, var(--accent-red) 14%, transparent)" stroke="var(--accent-red)" strokeWidth={1} opacity={0.8} />
          <text x={186} y={85} textAnchor="middle" className="text-[13px] font-bold uppercase tracking-wider" fill="var(--accent-red)">
            Traditional (Blocking I/O)
          </text>
        </g>

        <g className="row-label" style={{ opacity: 0 }}>
          <rect x={36} y={DIVIDER_Y + 12} width={320} height={34} rx={7} fill="color-mix(in srgb, var(--accent-amber) 14%, transparent)" stroke="var(--accent-amber)" strokeWidth={1} opacity={0.8} />
          <text x={196} y={DIVIDER_Y + 35} textAnchor="middle" className="text-[13px] font-bold uppercase tracking-wider" fill="var(--accent-amber)">
            Anekant (Async Event-Driven)
          </text>
        </g>

        {/* ═══════════ TRADITIONAL ROW ═══════════ */}
        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_EXCHANGE.cx - TRAD_EXCHANGE.w / 2} y={TRAD_EXCHANGE.cy - TRAD_EXCHANGE.h / 2} width={TRAD_EXCHANGE.w} height={TRAD_EXCHANGE.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_EXCHANGE.cx} y={TRAD_EXCHANGE.cy + 5} textAnchor="middle" className="text-[12px] font-bold" fill="var(--accent-red)">Exchange</text>
        </g>

        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_POLL.cx - TRAD_POLL.w / 2} y={TRAD_POLL.cy - TRAD_POLL.h / 2} width={TRAD_POLL.w} height={TRAD_POLL.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_POLL.cx} y={TRAD_POLL.cy - 3} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">Poll API</text>
          <text x={TRAD_POLL.cx} y={TRAD_POLL.cy + 11} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">HTTP</text>
        </g>

        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_CANDLES.cx - TRAD_CANDLES.w / 2} y={TRAD_CANDLES.cy - TRAD_CANDLES.h / 2} width={TRAD_CANDLES.w} height={TRAD_CANDLES.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_CANDLES.cx} y={TRAD_CANDLES.cy - 3} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">Candles</text>
          <text x={TRAD_CANDLES.cx} y={TRAD_CANDLES.cy + 11} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">blocking</text>
        </g>

        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_INDICATORS.cx - TRAD_INDICATORS.w / 2} y={TRAD_INDICATORS.cy - TRAD_INDICATORS.h / 2} width={TRAD_INDICATORS.w} height={TRAD_INDICATORS.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_INDICATORS.cx} y={TRAD_INDICATORS.cy - 3} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">Indicators</text>
          <text x={TRAD_INDICATORS.cx} y={TRAD_INDICATORS.cy + 11} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">blocking</text>
        </g>

        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_STRATEGY.cx - TRAD_STRATEGY.w / 2} y={TRAD_STRATEGY.cy - TRAD_STRATEGY.h / 2} width={TRAD_STRATEGY.w} height={TRAD_STRATEGY.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_STRATEGY.cx} y={TRAD_STRATEGY.cy - 3} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">Strategy</text>
          <text x={TRAD_STRATEGY.cx} y={TRAD_STRATEGY.cy + 11} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">evaluate</text>
        </g>

        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_ORDER.cx - TRAD_ORDER.w / 2} y={TRAD_ORDER.cy - TRAD_ORDER.h / 2} width={TRAD_ORDER.w} height={TRAD_ORDER.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_ORDER.cx} y={TRAD_ORDER.cy - 3} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">Place Order</text>
          <text x={TRAD_ORDER.cx} y={TRAD_ORDER.cy + 11} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">HTTP</text>
        </g>

        <g className="trad-node" style={{ opacity: 0 }}>
          <rect x={TRAD_BROKER.cx - TRAD_BROKER.w / 2} y={TRAD_BROKER.cy - TRAD_BROKER.h / 2} width={TRAD_BROKER.w} height={TRAD_BROKER.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text x={TRAD_BROKER.cx} y={TRAD_BROKER.cy + 5} textAnchor="middle" className="text-[12px] font-bold" fill="var(--accent-red)">Broker</text>
        </g>

        {/* Traditional paths */}
        <path d={tradPath(TRAD_EXCHANGE, TRAD_POLL)} className="trad-path trad-path-0" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={tradPath(TRAD_POLL, TRAD_CANDLES)} className="trad-path trad-path-1" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={tradPath(TRAD_CANDLES, TRAD_INDICATORS)} className="trad-path trad-path-2" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={tradPath(TRAD_INDICATORS, TRAD_STRATEGY)} className="trad-path trad-path-3" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={tradPath(TRAD_STRATEGY, TRAD_ORDER)} className="trad-path trad-path-4" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={tradPath(TRAD_ORDER, TRAD_BROKER)} className="trad-path trad-path-5" fill="none" stroke="var(--accent-red)" strokeWidth={2} />

        {/* Wait indicators */}
        {WAIT_POSITIONS.map((pos, i) => (
          <g key={`wait-${i}`} className={`wait-indicator wait-indicator-${i}`} style={{ opacity: 0 }}>
            <rect x={pos.x - 26} y={pos.y - 9} width={52} height={18} rx={4} fill="color-mix(in srgb, var(--accent-red) 20%, transparent)" stroke="var(--accent-red)" strokeWidth={0.8} />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="text-[9px] font-semibold" fill="var(--accent-red)">wait...</text>
          </g>
        ))}

        {/* Traditional timing callout - PERSISTENT */}
        <g className="timing-callout" style={{ opacity: 0 }}>
          <rect x={TRAD_BROKER.cx + TRAD_BROKER.w / 2 + 25} y={TRAD_Y - 40} width={160} height={80} rx={10} fill="color-mix(in srgb, var(--accent-red) 15%, var(--bg-card))" stroke="var(--accent-red)" strokeWidth={1.5} />
          <text x={TRAD_BROKER.cx + TRAD_BROKER.w / 2 + 105} y={TRAD_Y - 15} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-red)">3-5 sec</text>
          <text x={TRAD_BROKER.cx + TRAD_BROKER.w / 2 + 105} y={TRAD_Y + 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">per tick cycle</text>
          <text x={TRAD_BROKER.cx + TRAD_BROKER.w / 2 + 105} y={TRAD_Y + 25} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-red)">Synchronous</text>
          <text x={TRAD_BROKER.cx + TRAD_BROKER.w / 2 + 105} y={TRAD_Y + 38} textAnchor="middle" className="text-[10px]" fill="var(--accent-red)">Blocking I/O</text>
        </g>

        {/* Traditional dot */}
        <circle className="trad-dot" cx={TRAD_EXCHANGE.cx} cy={TRAD_Y} r={6} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />

        {/* ═══════════ ANEKANT ROW ═══════════ */}
        
        {/* Exchange */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={ANE_EXCHANGE.cx - ANE_EXCHANGE.w / 2} y={ANE_EXCHANGE.cy - ANE_EXCHANGE.h / 2} width={ANE_EXCHANGE.w} height={ANE_EXCHANGE.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={ANE_EXCHANGE.cx} y={ANE_EXCHANGE.cy + 5} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Exchange</text>
        </g>

        {/* Redis Streams */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={ANE_REDIS.cx - ANE_REDIS.w / 2} y={ANE_REDIS.cy - ANE_REDIS.h / 2} width={ANE_REDIS.w} height={ANE_REDIS.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy - 22} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Streams</text>
          <text x={ANE_REDIS.cx} y={ANE_REDIS.cy + 26} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">real-time bus</text>
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
            badge={eIdx === 0 ? "Async Dispatcher" : undefined}
          />
        ))}

        {/* Engine → Broker paths */}
        {ENGINES.map((_, i) => (
          <path key={`e2b-${i}`} d={aneEngineToBroker(i)} className={`ane-path ane-path-e2b-${i}`} fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.35} />
        ))}

        {/* Orders label */}
        <text x={(ENGINES[0].cx + ENGINE_W / 2 + ANE_BROKER.cx - ANE_BROKER.w / 2) / 2} y={ENGINES[0].cy - 24} textAnchor="middle" className="ane-node text-[11px] font-semibold" fill="var(--accent-coral)" style={{ opacity: 0 }}>Orders</text>

        {/* Broker */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={ANE_BROKER.cx - ANE_BROKER.w / 2} y={ANE_BROKER.cy - ANE_BROKER.h / 2} width={ANE_BROKER.w} height={ANE_BROKER.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={ANE_BROKER.cx} y={ANE_BROKER.cy + 5} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Broker</text>
        </g>

        {/* Broker → Engine return paths */}
        {ENGINES.map((_, i) => (
          <path key={`b2e-${i}`} d={aneBrokerToEngine(i)} className={`ane-path ret-path ret-path-b2e-${i}`} fill="none" stroke="var(--accent-emerald)" strokeWidth={1.4} opacity={0.3} strokeDasharray="7 5" />
        ))}

        {/* Fills label */}
        <text x={(ENGINES[2].cx + ENGINE_W / 2 + ANE_BROKER.cx - ANE_BROKER.w / 2) / 2} y={ENGINES[2].cy + ENGINE_H / 2 + 38} textAnchor="middle" className="ane-node text-[11px] font-semibold" fill="var(--accent-emerald)" style={{ opacity: 0 }}>Fills</text>

        {/* Anekant timing callout - PERSISTENT */}
        <g className="timing-callout" style={{ opacity: 0 }}>
          <rect x={ANE_BROKER.cx + ANE_BROKER.w / 2 + 25} y={ANE_MID_Y - 50} width={160} height={100} rx={10} fill="color-mix(in srgb, var(--accent-emerald) 15%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.5} />
          <text x={ANE_BROKER.cx + ANE_BROKER.w / 2 + 105} y={ANE_MID_Y - 22} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-emerald)">1-2 ms</text>
          <text x={ANE_BROKER.cx + ANE_BROKER.w / 2 + 105} y={ANE_MID_Y - 2} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">per tick</text>
          <text x={ANE_BROKER.cx + ANE_BROKER.w / 2 + 105} y={ANE_MID_Y + 20} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-amber)">Async I/O</text>
          <text x={ANE_BROKER.cx + ANE_BROKER.w / 2 + 105} y={ANE_MID_Y + 35} textAnchor="middle" className="text-[10px]" fill="var(--accent-coral)">Event-driven</text>
          <text x={ANE_BROKER.cx + ANE_BROKER.w / 2 + 105} y={ANE_MID_Y + 50} textAnchor="middle" className="text-[10px]" fill="var(--accent-emerald)">Non-blocking</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        <circle className="ane-dot-ex-redis" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />

        {ENGINES.map((_, i) => (
          <circle key={`rd-${i}`} className={`ane-dot-r2e-${i}`} r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        ))}

        {ENGINES.map((_, eIdx) =>
          ENGINE_ITEMS.map((_, iIdx) => (
            <circle key={`id-${eIdx}-${iIdx}`} className={`int-dot-${eIdx}-${iIdx}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
          )),
        )}

        {ENGINES.map((_, i) => (
          <circle key={`od-${i}`} className={`ane-dot-e2b-${i}`} r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        ))}

        {ENGINES.map((_, i) => (
          <circle key={`fd-${i}`} className={`ret-dot-b2e-${i}`} r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
      </svg>
    </SlideLayout>
  );
}
