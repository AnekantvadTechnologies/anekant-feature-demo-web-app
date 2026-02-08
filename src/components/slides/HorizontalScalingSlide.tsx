import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot } from "./shared/animate-dot";

/* ================================================================
 *  HorizontalScalingSlide - "Scale Without Rewrites"
 *
 *  Shows 3 columns demonstrating linear scaling:
 *    - Left: 1 Engine (saturated, slow)
 *    - Center: 3 Engines (distributed, fast)
 *    - Right: N Engines (unlimited scaling)
 *
 *  All fed by same Redis Streams at top.
 * ================================================================ */

interface HorizontalScalingSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const COL_1_X = 280;
const COL_2_X = VB_W / 2;
const COL_3_X = VB_W - 280;

const REDIS_Y = 180;
const ENGINE_Y = 480;
const ENGINE_W = 160;
const ENGINE_H = 120;

/* Column 1: Single engine */
const REDIS_1 = { cx: COL_1_X, cy: REDIS_Y, w: 150, h: 70 };
const ENGINE_1 = { cx: COL_1_X, cy: ENGINE_Y, w: ENGINE_W, h: ENGINE_H };

/* Column 2: Three engines */
const REDIS_2 = { cx: COL_2_X, cy: REDIS_Y, w: 150, h: 70 };
const ENGINE_2_POSITIONS = [
  { cx: COL_2_X - 180, cy: ENGINE_Y - 100, w: ENGINE_W, h: ENGINE_H },
  { cx: COL_2_X, cy: ENGINE_Y + 50, w: ENGINE_W, h: ENGINE_H },
  { cx: COL_2_X + 180, cy: ENGINE_Y - 100, w: ENGINE_W, h: ENGINE_H },
];

/* Column 3: N engines */
const REDIS_3 = { cx: COL_3_X, cy: REDIS_Y, w: 150, h: 70 };
const ENGINE_3_POSITIONS = [
  { cx: COL_3_X - 130, cy: ENGINE_Y - 80, w: 100, h: 80 },
  { cx: COL_3_X, cy: ENGINE_Y + 30, w: 100, h: 80 },
  { cx: COL_3_X + 130, cy: ENGINE_Y - 80, w: 100, h: 80 },
  { cx: COL_3_X - 65, cy: ENGINE_Y + 120, w: 100, h: 80 },
  { cx: COL_3_X + 65, cy: ENGINE_Y + 120, w: 100, h: 80 },
];

/* Throughput badge positions */
const THROUGHPUT_Y = 720;

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathRedisToEngine(redis: typeof REDIS_1, engine: typeof ENGINE_1): string {
  return bezierH(redis.cx, redis.cy + redis.h / 2, engine.cx, engine.cy - engine.h / 2);
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function HorizontalScalingSlide({ active }: HorizontalScalingSlideProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const loopTlRef = useRef<gsap.core.Timeline | null>(null);
  const counterRefs = useRef<{ [key: string]: number }>({ col1: 0, col2: 0, col3: 0 });

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

    const allPaths = svg.querySelectorAll<SVGPathElement>(".flow-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    /* Column headers */
    const headers = svg.querySelectorAll(".col-header");
    reveal.fromTo(headers, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: "power2.out" }, "-=0.2");

    /* Redis nodes */
    const redisNodes = svg.querySelectorAll(".redis-node");
    reveal.fromTo(redisNodes, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out" }, "-=0.1");

    /* Engine nodes */
    const engineNodes = svg.querySelectorAll(".engine-node");
    reveal.fromTo(engineNodes, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }, "-=0.2");

    /* Paths */
    reveal.to(allPaths, { opacity: 0.5, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Throughput badges */
    const throughputBadges = svg.querySelectorAll(".throughput-badge");
    reveal.fromTo(throughputBadges, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.15, ease: "back.out" }, "-=0.2");

    /* Key message */
    const keyMessage = svg.querySelector(".key-message");
    reveal.fromTo(keyMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.1");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.2, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Column 1: Single slow dot */
    const p1 = svg.querySelector<SVGPathElement>(".path-col1");
    const d1 = svg.querySelector<SVGCircleElement>(".dot-col1");
    if (p1 && d1) animateDot(d1, p1, loop, 1.2, 0); // Slow!

    /* Column 2: 3 parallel fast dots */
    for (let i = 0; i < 3; i++) {
      const p = svg.querySelector<SVGPathElement>(`.path-col2-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-col2-${i}`);
      if (p && d) animateDot(d, p, loop, 0.4, 0.1 + i * 0.08);
    }

    /* Column 3: 5 parallel very fast dots */
    for (let i = 0; i < 5; i++) {
      const p = svg.querySelector<SVGPathElement>(`.path-col3-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-col3-${i}`);
      if (p && d) animateDot(d, p, loop, 0.3, 0.05 + i * 0.05);
    }

    /* Animate throughput counters */
    const counter1 = svg.querySelector(".counter-1");
    const counter2 = svg.querySelector(".counter-2");
    const counter3 = svg.querySelector(".counter-3");

    if (counter1 && counter2 && counter3) {
      loop.to(counterRefs.current, {
        col1: 1000,
        col2: 3000,
        col3: 10000,
        duration: 1.5,
        ease: "power1.inOut",
        onUpdate() {
          counter1.textContent = Math.round(counterRefs.current.col1).toLocaleString();
          counter2.textContent = Math.round(counterRefs.current.col2).toLocaleString();
          counter3.textContent = Math.round(counterRefs.current.col3).toLocaleString();
        },
      }, 0);

      loop.to(counterRefs.current, {
        col1: 1000,
        col2: 3000,
        col3: 10000,
        duration: 0.5,
      });
    }

    return () => {
      reveal.kill();
      loop.kill();
      counterRefs.current = { col1: 0, col2: 0, col3: 0 };
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Scale Without Rewrites
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Add engines, not code changes — linear throughput scaling
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

        {/* ═══════════ COLUMN HEADERS ═══════════ */}
        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={COL_1_X - 80} y={70} width={160} height={36} rx={8} fill="color-mix(in srgb, var(--accent-red) 15%, transparent)" stroke="var(--accent-red)" strokeWidth={1} />
          <text x={COL_1_X} y={95} textAnchor="middle" className="text-[14px] font-bold uppercase tracking-wide" fill="var(--accent-red)">Single Engine</text>
        </g>

        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={COL_2_X - 90} y={70} width={180} height={36} rx={8} fill="color-mix(in srgb, var(--accent-amber) 15%, transparent)" stroke="var(--accent-amber)" strokeWidth={1} />
          <text x={COL_2_X} y={95} textAnchor="middle" className="text-[14px] font-bold uppercase tracking-wide" fill="var(--accent-amber)">3 Engines</text>
        </g>

        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={COL_3_X - 90} y={70} width={180} height={36} rx={8} fill="color-mix(in srgb, var(--accent-emerald) 15%, transparent)" stroke="var(--accent-emerald)" strokeWidth={1} />
          <text x={COL_3_X} y={95} textAnchor="middle" className="text-[14px] font-bold uppercase tracking-wide" fill="var(--accent-emerald)">N Engines</text>
        </g>

        {/* ═══════════ DIVIDERS ═══════════ */}
        <line x1={VB_W / 3 + 30} y1={130} x2={VB_W / 3 + 30} y2={800} stroke="var(--border-subtle)" strokeWidth={1} strokeDasharray="8 6" opacity={0.4} />
        <line x1={2 * VB_W / 3 - 30} y1={130} x2={2 * VB_W / 3 - 30} y2={800} stroke="var(--border-subtle)" strokeWidth={1} strokeDasharray="8 6" opacity={0.4} />

        {/* ═══════════ COLUMN 1: SINGLE ENGINE ═══════════ */}
        
        {/* Redis */}
        <g className="redis-node" style={{ opacity: 0 }}>
          <rect x={REDIS_1.cx - REDIS_1.w / 2} y={REDIS_1.cy - REDIS_1.h / 2} width={REDIS_1.w} height={REDIS_1.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.4} />
          <text x={REDIS_1.cx} y={REDIS_1.cy - 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={REDIS_1.cx} y={REDIS_1.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Streams</text>
        </g>

        {/* Single Engine */}
        <g className="engine-node" style={{ opacity: 0 }}>
          <rect x={ENGINE_1.cx - ENGINE_1.w / 2} y={ENGINE_1.cy - ENGINE_1.h / 2} width={ENGINE_1.w} height={ENGINE_1.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.6} />
          <text x={ENGINE_1.cx} y={ENGINE_1.cy - 10} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-red)">Engine</text>
          <text x={ENGINE_1.cx} y={ENGINE_1.cy + 12} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Saturated</text>
          <text x={ENGINE_1.cx} y={ENGINE_1.cy + 30} textAnchor="middle" className="text-[9px]" fill="var(--accent-red)">100% CPU</text>
        </g>

        {/* Path */}
        <path d={pathRedisToEngine(REDIS_1, ENGINE_1)} className="flow-path path-col1" fill="none" stroke="var(--accent-red)" strokeWidth={2} />

        {/* Bottleneck indicator */}
        <g className="engine-node" style={{ opacity: 0 }}>
          <rect x={ENGINE_1.cx - 55} y={ENGINE_1.cy - ENGINE_1.h / 2 - 90} width={110} height={28} rx={6} fill="color-mix(in srgb, var(--accent-red) 20%, var(--bg-card))" stroke="var(--accent-red)" strokeWidth={0.8} />
          <text x={ENGINE_1.cx} y={ENGINE_1.cy - ENGINE_1.h / 2 - 70} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-red)">⚠ Bottleneck</text>
        </g>

        {/* ═══════════ COLUMN 2: THREE ENGINES ═══════════ */}
        
        {/* Redis */}
        <g className="redis-node" style={{ opacity: 0 }}>
          <rect x={REDIS_2.cx - REDIS_2.w / 2} y={REDIS_2.cy - REDIS_2.h / 2} width={REDIS_2.w} height={REDIS_2.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.4} />
          <text x={REDIS_2.cx} y={REDIS_2.cy - 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={REDIS_2.cx} y={REDIS_2.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Streams</text>
        </g>

        {/* Three Engines */}
        {ENGINE_2_POSITIONS.map((eng, i) => (
          <g key={`eng2-${i}`} className="engine-node" style={{ opacity: 0 }}>
            <rect x={eng.cx - eng.w / 2} y={eng.cy - eng.h / 2} width={eng.w} height={eng.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.6} />
            <text x={eng.cx} y={eng.cy - 10} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-amber)">Engine {i + 1}</text>
            <text x={eng.cx} y={eng.cy + 12} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">~33% load</text>
          </g>
        ))}

        {/* Paths */}
        {ENGINE_2_POSITIONS.map((eng, i) => (
          <path key={`p2-${i}`} d={pathRedisToEngine(REDIS_2, eng)} className={`flow-path path-col2-${i}`} fill="none" stroke="var(--accent-amber)" strokeWidth={2} />
        ))}

        {/* ═══════════ COLUMN 3: N ENGINES ═══════════ */}
        
        {/* Redis */}
        <g className="redis-node" style={{ opacity: 0 }}>
          <rect x={REDIS_3.cx - REDIS_3.w / 2} y={REDIS_3.cy - REDIS_3.h / 2} width={REDIS_3.w} height={REDIS_3.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-emerald)" strokeWidth={1.4} />
          <text x={REDIS_3.cx} y={REDIS_3.cy - 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={REDIS_3.cx} y={REDIS_3.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Streams</text>
        </g>

        {/* N Engines */}
        {ENGINE_3_POSITIONS.map((eng, i) => (
          <g key={`eng3-${i}`} className="engine-node" style={{ opacity: 0 }}>
            <rect x={eng.cx - eng.w / 2} y={eng.cy - eng.h / 2} width={eng.w} height={eng.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-emerald)" strokeWidth={1.4} />
            <text x={eng.cx} y={eng.cy - 5} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-emerald)">E{i + 1}</text>
            <text x={eng.cx} y={eng.cy + 12} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">~20%</text>
          </g>
        ))}

        {/* Plus more indicator */}
        <g className="engine-node" style={{ opacity: 0 }}>
          <text x={COL_3_X} y={ENGINE_Y + 200} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-emerald)">+ more...</text>
        </g>

        {/* Paths */}
        {ENGINE_3_POSITIONS.map((eng, i) => (
          <path key={`p3-${i}`} d={pathRedisToEngine(REDIS_3, eng)} className={`flow-path path-col3-${i}`} fill="none" stroke="var(--accent-emerald)" strokeWidth={1.8} />
        ))}

        {/* ═══════════ THROUGHPUT BADGES ═══════════ */}
        
        {/* Column 1 throughput */}
        <g className="throughput-badge" style={{ opacity: 0 }}>
          <rect x={COL_1_X - 90} y={THROUGHPUT_Y} width={180} height={70} rx={12} fill="color-mix(in srgb, var(--accent-red) 12%, var(--bg-card))" stroke="var(--accent-red)" strokeWidth={1.2} />
          <text className="counter-1 text-[22px] font-bold" x={COL_1_X} y={THROUGHPUT_Y + 30} textAnchor="middle" fill="var(--accent-red)">1,000</text>
          <text x={COL_1_X} y={THROUGHPUT_Y + 52} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">ticks/sec</text>
        </g>

        {/* Column 2 throughput */}
        <g className="throughput-badge" style={{ opacity: 0 }}>
          <rect x={COL_2_X - 90} y={THROUGHPUT_Y} width={180} height={70} rx={12} fill="color-mix(in srgb, var(--accent-amber) 12%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text className="counter-2 text-[22px] font-bold" x={COL_2_X} y={THROUGHPUT_Y + 30} textAnchor="middle" fill="var(--accent-amber)">3,000</text>
          <text x={COL_2_X} y={THROUGHPUT_Y + 52} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">ticks/sec (3x)</text>
        </g>

        {/* Column 3 throughput */}
        <g className="throughput-badge" style={{ opacity: 0 }}>
          <rect x={COL_3_X - 90} y={THROUGHPUT_Y} width={180} height={70} rx={12} fill="color-mix(in srgb, var(--accent-emerald) 12%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.2} />
          <text className="counter-3 text-[22px] font-bold" x={COL_3_X} y={THROUGHPUT_Y + 30} textAnchor="middle" fill="var(--accent-emerald)">10,000</text>
          <text x={COL_3_X} y={THROUGHPUT_Y + 52} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">ticks/sec (10x)</text>
        </g>

        {/* ═══════════ KEY MESSAGE ═══════════ */}
        <g className="key-message" style={{ opacity: 0 }}>
          <rect x={VB_W / 2 - 220} y={840} width={440} height={50} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={VB_W / 2} y={865} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">Same Code • Same Redis • Linear Scaling</text>
          <text x={VB_W / 2} y={882} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">No architectural changes required</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        <circle className="dot-col1" r={6} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />
        
        {ENGINE_2_POSITIONS.map((_, i) => (
          <circle key={`d2-${i}`} className={`dot-col2-${i}`} r={5} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        ))}
        
        {ENGINE_3_POSITIONS.map((_, i) => (
          <circle key={`d3-${i}`} className={`dot-col3-${i}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
      </svg>
    </SlideLayout>
  );
}
