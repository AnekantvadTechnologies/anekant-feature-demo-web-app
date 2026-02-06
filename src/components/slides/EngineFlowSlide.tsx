import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  EngineFlowSlide - Warm Industrial Aesthetic
 *  SCALED 20% LARGER - NO blue/purple colors
 *
 *  Single full-screen slide showing TWO rows:
 *    Top  (~30%) — Traditional polling: Exchange streams ticks →
 *                  Tick Buffer (overflow) → Polling Gateway → Process → Strategy
 *    Bottom (~70%) — Anekant engine: Exchange → Redis → 3 Engines
 *                    (internal parallel processing) → Broker → Fills back
 * ================================================================ */

interface EngineFlowSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  TRADITIONAL ROW — Polling Architecture (redesigned)
 *  Shows: Exchange → Tick Buffer (with overflow) → Polling Gateway → Process → Strategy
 * ──────────────────────────────────────────────────────────── */
const DIVIDER_Y = 276;
const TRAD_Y = 156;
const TRAD_BOX_H = 62;

/* Exchange box - where ticks originate */
const TRAD_EXCHANGE = { cx: 120, cy: TRAD_Y, w: 140, h: TRAD_BOX_H };

/* Tick Buffer - shows accumulation and overflow */
const TRAD_BUFFER = { cx: 340, cy: TRAD_Y, w: 160, h: 90 };

/* Polling Gateway - grabs snapshot periodically */
const TRAD_POLL = { cx: 580, cy: TRAD_Y, w: 180, h: TRAD_BOX_H };

/* Process Snapshot - candles + indicators combined */
const TRAD_PROCESS = { cx: 820, cy: TRAD_Y, w: 180, h: TRAD_BOX_H };

/* Evaluate Strategy */
const TRAD_STRATEGY = { cx: 1060, cy: TRAD_Y, w: 180, h: TRAD_BOX_H };

/* Number of tick dots in the buffer animation */
const BUFFER_TICK_COUNT = 6;

function tradPathExToBuffer(): string {
  return `M ${TRAD_EXCHANGE.cx + TRAD_EXCHANGE.w / 2} ${TRAD_Y} L ${TRAD_BUFFER.cx - TRAD_BUFFER.w / 2} ${TRAD_Y}`;
}

function tradPathBufferToPoll(): string {
  return `M ${TRAD_BUFFER.cx + TRAD_BUFFER.w / 2} ${TRAD_Y} L ${TRAD_POLL.cx - TRAD_POLL.w / 2} ${TRAD_Y}`;
}

function tradPathPollToProcess(): string {
  return `M ${TRAD_POLL.cx + TRAD_POLL.w / 2} ${TRAD_Y} L ${TRAD_PROCESS.cx - TRAD_PROCESS.w / 2} ${TRAD_Y}`;
}

function tradPathProcessToStrategy(): string {
  return `M ${TRAD_PROCESS.cx + TRAD_PROCESS.w / 2} ${TRAD_Y} L ${TRAD_STRATEGY.cx - TRAD_STRATEGY.w / 2} ${TRAD_Y}`;
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

    /* Traditional extras (stale data label, etc) */
    const tradExtra = svg.querySelectorAll(".trad-extra");
    reveal.fromTo(
      tradExtra,
      { opacity: 0 },
      { opacity: 0.6, duration: 0.35, stagger: 0.04 },
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

    /* — Traditional: polling cycle with tick accumulation & drop — */
    
    /* Animate continuous incoming ticks (Exchange → Buffer) */
    const inTickPath = svg.querySelector<SVGPathElement>(".trad-path-ex-buf");
    const inTicks = svg.querySelectorAll<SVGCircleElement>(".in-tick");
    if (inTickPath && inTicks.length > 0) {
      const pathLen = inTickPath.getTotalLength();
      inTicks.forEach((tick, i) => {
        const startT = i * 0.5; /* staggered start times */
        loop.fromTo(
          tick,
          { opacity: 0 },
          {
            opacity: 0.8,
            duration: 0.4,
            ease: "sine.inOut",
            onUpdate() {
              const progress = this.progress();
              const pt = inTickPath.getPointAtLength(progress * pathLen);
              gsap.set(tick, { attr: { cx: pt.x, cy: pt.y } });
            },
            onComplete() {
              gsap.to(tick, { opacity: 0, duration: 0.1 });
            },
          },
          startT,
        );
      });
    }

    /* Animate buffer ticks appearing (accumulation) */
    const bufferTicks = svg.querySelectorAll<SVGCircleElement>(".buffer-tick");
    bufferTicks.forEach((tick, i) => {
      const appearT = 0.3 + i * 0.35;
      loop.fromTo(
        tick,
        { opacity: 0, scale: 0.5 },
        { opacity: 0.7, scale: 1, duration: 0.2, transformOrigin: "center center", ease: "back.out" },
        appearT,
      );
    });

    /* Show overflow indicator */
    const tradOverflow = svg.querySelector(".trad-overflow");
    if (tradOverflow) {
      loop.fromTo(
        tradOverflow,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" },
        2.0,
      );
    }

    /* Animate dropped dots falling */
    const dropDots = svg.querySelectorAll<SVGCircleElement>(".drop-dot");
    dropDots.forEach((dot, i) => {
      loop.fromTo(
        dot,
        { opacity: 0.6, attr: { cy: TRAD_BUFFER.cy + TRAD_BUFFER.h / 2 + 32 } },
        { opacity: 0, attr: { cy: TRAD_BUFFER.cy + TRAD_BUFFER.h / 2 + 55 }, duration: 0.6, ease: "power2.in" },
        2.2 + i * 0.15,
      );
    });

    /* Pulse the polling timer */
    const pollTimer = svg.querySelector(".poll-timer");
    const pollBox = svg.querySelector(".poll-box");
    if (pollTimer && pollBox) {
      loop.to(pollTimer, { scale: 1.3, transformOrigin: "center center", duration: 0.15, ease: "power2.out" }, 2.5);
      loop.to(pollTimer, { scale: 1, duration: 0.15, ease: "power2.in" }, 2.65);
      loop.to(pollBox, { stroke: "var(--accent-amber)", duration: 0.1 }, 2.5);
      loop.to(pollBox, { stroke: "var(--accent-red)", duration: 0.3 }, 2.7);
    }

    /* Poll grabs ONE tick - animate from buffer through the rest of the pipeline */
    const pollDot = svg.querySelector<SVGCircleElement>(".trad-poll-dot");
    const bufPollPath = svg.querySelector<SVGPathElement>(".trad-path-buf-poll");
    const pollProcPath = svg.querySelector<SVGPathElement>(".trad-path-poll-proc");
    const procStratPath = svg.querySelector<SVGPathElement>(".trad-path-proc-strat");
    
    if (pollDot && bufPollPath && pollProcPath && procStratPath) {
      /* Start position at buffer */
      gsap.set(pollDot, { attr: { cx: TRAD_BUFFER.cx + TRAD_BUFFER.w / 2, cy: TRAD_Y }, opacity: 0 });
      
      /* Fade in */
      loop.to(pollDot, { opacity: 1, duration: 0.15 }, 2.6);
      
      /* Buffer → Poll (slow) */
      const bufPollLen = bufPollPath.getTotalLength();
      loop.to(pollDot, {
        duration: 0.6,
        ease: "power1.inOut",
        onUpdate() {
          const progress = this.progress();
          const pt = bufPollPath.getPointAtLength(progress * bufPollLen);
          gsap.set(pollDot, { attr: { cx: pt.x, cy: pt.y } });
        },
      }, 2.75);
      
      /* Poll → Process (slow) */
      const pollProcLen = pollProcPath.getTotalLength();
      loop.to(pollDot, {
        duration: 0.7,
        ease: "power1.inOut",
        onUpdate() {
          const progress = this.progress();
          const pt = pollProcPath.getPointAtLength(progress * pollProcLen);
          gsap.set(pollDot, { attr: { cx: pt.x, cy: pt.y } });
        },
      }, 3.45);
      
      /* Process → Strategy (slow) */
      const procStratLen = procStratPath.getTotalLength();
      loop.to(pollDot, {
        duration: 0.7,
        ease: "power1.inOut",
        onUpdate() {
          const progress = this.progress();
          const pt = procStratPath.getPointAtLength(progress * procStratLen);
          gsap.set(pollDot, { attr: { cx: pt.x, cy: pt.y } });
        },
      }, 4.25);
      
      /* Fade out */
      loop.to(pollDot, { opacity: 0, duration: 0.2 }, 5.0);
    }

    /* Clear buffer ticks (they got dropped) */
    loop.to(bufferTicks, { opacity: 0, duration: 0.3, stagger: 0.05 }, 2.8);
    
    /* Hide overflow indicator */
    if (tradOverflow) {
      loop.to(tradOverflow, { opacity: 0, duration: 0.2 }, 5.0);
    }

    /* Show stats callout */
    const tradStats = svg.querySelector(".trad-stats");
    if (tradStats) {
      loop.fromTo(tradStats, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5);
      loop.to(tradStats, { opacity: 0, duration: 0.2 }, 5.0);
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
    const totalTradTime = 5.5; /* Traditional poll cycle takes ~5.5s */
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
          x={VB_W / 2 - 260} y={DIVIDER_Y - 10}
          textAnchor="middle" className="text-[11px] italic font-medium" fill="var(--accent-red)" opacity={0.7}
        >
          Polls stale snapshots, drops intermediate ticks
        </text>
        <text
          x={VB_W / 2 + 260} y={DIVIDER_Y + 22}
          textAnchor="middle" className="text-[11px] italic font-medium" fill="var(--accent-amber)" opacity={0.7}
        >
          Every tick, every engine, processed in parallel
        </text>

        {/* ═══════════ ROW LABELS ═══════════ */}
        <g className="row-label" style={{ opacity: 0 }}>
          <rect
            x={36} y={62} width={260} height={34} rx={7}
            fill="color-mix(in srgb, var(--accent-red) 14%, transparent)"
            stroke="var(--accent-red)" strokeWidth={1} opacity={0.8}
          />
          <text x={166} y={85} textAnchor="middle" className="text-[13px] font-bold uppercase tracking-wider" fill="var(--accent-red)">
            Traditional Polling
          </text>
        </g>

        <g className="row-label" style={{ opacity: 0 }}>
          <rect
            x={36} y={DIVIDER_Y + 17} width={240} height={34} rx={7}
            fill="color-mix(in srgb, var(--accent-amber) 14%, transparent)"
            stroke="var(--accent-amber)" strokeWidth={1} opacity={0.8}
          />
          <text x={156} y={DIVIDER_Y + 40} textAnchor="middle" className="text-[13px] font-bold uppercase tracking-wider" fill="var(--accent-amber)">
            Anekant Engine
          </text>
        </g>

        {/* ═══════════ TRADITIONAL ROW — Polling Architecture ═══════════ */}

        {/* Exchange box - continuous tick stream */}
        <g className="trad-node" style={{ opacity: 0 }}>
          <rect
            x={TRAD_EXCHANGE.cx - TRAD_EXCHANGE.w / 2} y={TRAD_EXCHANGE.cy - TRAD_EXCHANGE.h / 2}
            width={TRAD_EXCHANGE.w} height={TRAD_EXCHANGE.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} opacity={0.9}
          />
          <text x={TRAD_EXCHANGE.cx} y={TRAD_EXCHANGE.cy - 4} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-red)">
            Exchange
          </text>
          <text x={TRAD_EXCHANGE.cx} y={TRAD_EXCHANGE.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">
            continuous ticks
          </text>
        </g>

        {/* Tick Buffer - shows accumulation and overflow */}
        <g className="trad-node" style={{ opacity: 0 }}>
          <rect
            x={TRAD_BUFFER.cx - TRAD_BUFFER.w / 2} y={TRAD_BUFFER.cy - TRAD_BUFFER.h / 2}
            width={TRAD_BUFFER.w} height={TRAD_BUFFER.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.4} strokeDasharray="4 2"
          />
          <text x={TRAD_BUFFER.cx} y={TRAD_BUFFER.cy - 24} textAnchor="middle" className="text-[13px] font-semibold" fill="var(--accent-red)">
            Tick Buffer
          </text>
          <text x={TRAD_BUFFER.cx} y={TRAD_BUFFER.cy - 8} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">
            (ignored between polls)
          </text>
          {/* Buffer slots visualization */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={`slot-${i}`}
              x={TRAD_BUFFER.cx - 70 + (i % 3) * 48}
              y={TRAD_BUFFER.cy + 6 + Math.floor(i / 3) * 18}
              width={42} height={14} rx={3}
              fill="var(--bg-secondary)" stroke="var(--accent-red)" strokeWidth={0.5} opacity={0.3}
              className="buffer-slot"
            />
          ))}
          {/* Animated tick dots inside buffer (positioned by GSAP) */}
          {Array.from({ length: BUFFER_TICK_COUNT }).map((_, i) => (
            <circle
              key={`buffer-tick-${i}`}
              className={`buffer-tick buffer-tick-${i}`}
              cx={TRAD_BUFFER.cx - 50 + (i % 3) * 48}
              cy={TRAD_BUFFER.cy + 13 + Math.floor(i / 3) * 18}
              r={5}
              fill="var(--accent-red)"
              opacity={0}
            />
          ))}
        </g>

        {/* Overflow/dropped indicator */}
        <g className="trad-overflow" style={{ opacity: 0 }}>
          <text x={TRAD_BUFFER.cx} y={TRAD_BUFFER.cy + TRAD_BUFFER.h / 2 + 18} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-red)">
            ↓ DROPPED
          </text>
          {/* Falling/fading dots */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`drop-${i}`}
              className={`drop-dot drop-dot-${i}`}
              cx={TRAD_BUFFER.cx - 20 + i * 20}
              cy={TRAD_BUFFER.cy + TRAD_BUFFER.h / 2 + 32}
              r={4}
              fill="var(--accent-red)"
              opacity={0}
            />
          ))}
        </g>

        {/* Polling Gateway */}
        <g className="trad-node" style={{ opacity: 0 }}>
          <rect
            x={TRAD_POLL.cx - TRAD_POLL.w / 2} y={TRAD_POLL.cy - TRAD_POLL.h / 2}
            width={TRAD_POLL.w} height={TRAD_POLL.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2}
            className="poll-box"
          />
          <text x={TRAD_POLL.cx} y={TRAD_POLL.cy - 4} textAnchor="middle" className="text-[13px] font-semibold" fill="var(--accent-red)">
            Polling Gateway
          </text>
          <text x={TRAD_POLL.cx} y={TRAD_POLL.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">
            every ~5 seconds
          </text>
          {/* Clock/timer icon */}
          <circle cx={TRAD_POLL.cx + TRAD_POLL.w / 2 - 20} cy={TRAD_POLL.cy - TRAD_POLL.h / 2 + 14} r={8} fill="none" stroke="var(--accent-red)" strokeWidth={1.2} className="poll-timer" />
          <line x1={TRAD_POLL.cx + TRAD_POLL.w / 2 - 20} y1={TRAD_POLL.cy - TRAD_POLL.h / 2 + 14} x2={TRAD_POLL.cx + TRAD_POLL.w / 2 - 20} y2={TRAD_POLL.cy - TRAD_POLL.h / 2 + 8} stroke="var(--accent-red)" strokeWidth={1.2} className="poll-timer-hand" />
        </g>

        {/* Process Snapshot */}
        <g className="trad-node" style={{ opacity: 0 }}>
          <rect
            x={TRAD_PROCESS.cx - TRAD_PROCESS.w / 2} y={TRAD_PROCESS.cy - TRAD_PROCESS.h / 2}
            width={TRAD_PROCESS.w} height={TRAD_PROCESS.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} opacity={0.8}
          />
          <text x={TRAD_PROCESS.cx} y={TRAD_PROCESS.cy - 4} textAnchor="middle" className="text-[13px] font-semibold" fill="var(--accent-red)">
            Process Snapshot
          </text>
          <text x={TRAD_PROCESS.cx} y={TRAD_PROCESS.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">
            candles + indicators
          </text>
        </g>

        {/* Evaluate Strategy */}
        <g className="trad-node" style={{ opacity: 0 }}>
          <rect
            x={TRAD_STRATEGY.cx - TRAD_STRATEGY.w / 2} y={TRAD_STRATEGY.cy - TRAD_STRATEGY.h / 2}
            width={TRAD_STRATEGY.w} height={TRAD_STRATEGY.h} rx={12}
            fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} opacity={0.8}
          />
          <text x={TRAD_STRATEGY.cx} y={TRAD_STRATEGY.cy + 5} textAnchor="middle" className="text-[13px] font-semibold" fill="var(--accent-red)">
            Evaluate Strategy
          </text>
        </g>

        {/* Connecting paths */}
        <path d={tradPathExToBuffer()} className="trad-path trad-path-ex-buf" fill="none" stroke="var(--accent-red)" strokeWidth={2} opacity={0.4} />
        <path d={tradPathBufferToPoll()} className="trad-path trad-path-buf-poll" fill="none" stroke="var(--accent-red)" strokeWidth={1.8} opacity={0.35} strokeDasharray="6 5" />
        <path d={tradPathPollToProcess()} className="trad-path trad-path-poll-proc" fill="none" stroke="var(--accent-red)" strokeWidth={1.8} opacity={0.35} strokeDasharray="6 5" />
        <path d={tradPathProcessToStrategy()} className="trad-path trad-path-proc-strat" fill="none" stroke="var(--accent-red)" strokeWidth={1.8} opacity={0.35} strokeDasharray="6 5" />

        {/* Incoming tick dots (Exchange → Buffer) */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={`in-tick-${i}`} className={`in-tick in-tick-${i}`} r={5} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />
        ))}

        {/* Single poll dot (Buffer → Poll → Process → Strategy) */}
        <circle className="trad-poll-dot" r={6} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />

        {/* Stats callout - positioned above the traditional row */}
        <g className="trad-stats" style={{ opacity: 0 }}>
          <rect
            x={TRAD_STRATEGY.cx - 20} y={TRAD_Y - 55}
            width={180} height={40} rx={8}
            fill="color-mix(in srgb, var(--accent-red) 12%, var(--bg-card))"
            stroke="var(--accent-red)" strokeWidth={1} opacity={0.9}
          />
          <text x={TRAD_STRATEGY.cx + 70} y={TRAD_Y - 40} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-red)">
            ~50 ticks arrive per poll
          </text>
          <text x={TRAD_STRATEGY.cx + 70} y={TRAD_Y - 24} textAnchor="middle" className="text-[10px] font-bold" fill="var(--accent-red)">
            → 1 stale snapshot processed
          </text>
        </g>

        {/* "stale data" label between poll and process */}
        <text
          x={(TRAD_POLL.cx + TRAD_PROCESS.cx) / 2} y={TRAD_Y + 44}
          textAnchor="middle" className="trad-extra text-[10px] italic" fill="var(--text-muted)" opacity={0}
        >
          stale data
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
