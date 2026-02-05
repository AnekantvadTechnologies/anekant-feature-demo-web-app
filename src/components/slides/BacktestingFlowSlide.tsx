import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, itemX, itemY, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  BacktestingFlowSlide
 *
 *  Full-screen diagram showing how live market data is replaced
 *  by historical replay:
 *    S3 → SQLite DB → Backtesting Dispatcher → Engine → Replay OMS
 *  With a simulated-time clock overlay and optional ghosted LLM path.
 *  Animation dots move faster (fast-forward feel).
 * ================================================================ */

interface BacktestingFlowSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  Layout constants
 * ──────────────────────────────────────────────────────────── */
const S3 = { cx: 80, cy: 320, w: 120, h: 64 };
const SQLITE = { cx: 260, cy: 320, w: 130, h: 64 };
const DISPATCHER = { cx: 470, cy: 320, w: 170, h: 80 };

const ENGINE_W = 260;
const ENGINE_H = 180;
const ENGINE = { cx: 730, cy: 320, w: ENGINE_W, h: ENGINE_H };

const REPLAY_OMS = { cx: 1040, cy: 320, w: 150, h: 80 };

/* Clock overlay position (over the engine) */
const CLOCK_CX = ENGINE.cx + ENGINE.w / 2 - 30;
const CLOCK_CY = ENGINE.cy - ENGINE.h / 2 - 20;

/* Ghosted LLM path nodes (dimmed) */
const GHOST_AGENT = { cx: 850, cy: 560, w: 150, h: 50 };
const GHOST_LLM = { cx: 1080, cy: 560, w: 120, h: 50 };

/* ────────────────────────────────────────────────────────────
 *  Path builders
 * ──────────────────────────────────────────────────────────── */
const pathS3ToSqlite = () =>
  bezierH(S3.cx + S3.w / 2, S3.cy, SQLITE.cx - SQLITE.w / 2, SQLITE.cy);

const pathSqliteToDispatcher = () =>
  bezierH(SQLITE.cx + SQLITE.w / 2, SQLITE.cy, DISPATCHER.cx - DISPATCHER.w / 2, DISPATCHER.cy);

const pathDispatcherToEngine = () =>
  bezierH(DISPATCHER.cx + DISPATCHER.w / 2, DISPATCHER.cy, ENGINE.cx - ENGINE.w / 2, ENGINE.cy);

const pathEngineToReplayOms = () =>
  bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy, REPLAY_OMS.cx - REPLAY_OMS.w / 2, REPLAY_OMS.cy);

const pathReplayOmsToEngine = (): string => {
  const x1 = REPLAY_OMS.cx - REPLAY_OMS.w / 2;
  const y1 = REPLAY_OMS.cy + 25;
  const x2 = ENGINE.cx + ENGINE.w / 2;
  const y2 = ENGINE.cy + 30;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 40}, ${cpx} ${y2 + 40}, ${x2} ${y2}`;
};

/* Ghost paths for optional LLM integration */
const pathEngineToGhostAgent = (): string => {
  const x1 = ENGINE.cx;
  const y1 = ENGINE.cy + ENGINE.h / 2;
  const x2 = GHOST_AGENT.cx - GHOST_AGENT.w / 2;
  const y2 = GHOST_AGENT.cy;
  return bezierH(x1, y1, x2, y2);
};

const pathGhostAgentToLLM = () =>
  bezierH(GHOST_AGENT.cx + GHOST_AGENT.w / 2, GHOST_AGENT.cy, GHOST_LLM.cx - GHOST_LLM.w / 2, GHOST_LLM.cy);

/* Engine internal fan-out */
function engineInternalPath(itemIdx: number): string {
  const x1 = ENGINE.cx - ENGINE.w / 2 + 20;
  const y1 = ENGINE.cy;
  const x2 = itemX(ENGINE.cx) - 110 / 2;
  const y2 = itemY(ENGINE.cy, ENGINE.h, itemIdx);
  return bezierH(x1, y1, x2, y2);
}

/* ================================================================
 *  Main component
 * ================================================================ */
export function BacktestingFlowSlide({ active }: BacktestingFlowSlideProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const loopTlRef = useRef<gsap.core.Timeline | null>(null);
  const clockRef = useRef<SVGTextElement>(null);

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

    /* ──────── REVEAL ──────── */
    const reveal = gsap.timeline();
    revealTlRef.current = reveal;

    reveal.fromTo(titleRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" });

    const nodes = svg.querySelectorAll(".ane-node");
    reveal.fromTo(nodes, { opacity: 0, scale: 0.85, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.04, ease: "back.out(1.3)" }, "-=0.2");

    const ghostNodes = svg.querySelectorAll(".ghost-node");
    reveal.fromTo(ghostNodes, { opacity: 0 }, { opacity: 0.25, duration: 0.5, stagger: 0.05 }, "-=0.1");

    const allPaths = svg.querySelectorAll<SVGPathElement>(".ane-path, .int-path, .ret-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    reveal.to(allPaths, { strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power2.inOut" });

    const ghostPaths = svg.querySelectorAll<SVGPathElement>(".ghost-path");
    ghostPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    reveal.to(ghostPaths, { strokeDashoffset: 0, duration: 0.5, stagger: 0.05, ease: "power2.inOut" }, "-=0.3");

    const items = svg.querySelectorAll(".engine-item");
    reveal.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" }, "-=0.3");

    const badges = svg.querySelectorAll(".badge-node");
    reveal.fromTo(badges, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, "-=0.2");

    const labels = svg.querySelectorAll(".label-node");
    reveal.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.04 }, "-=0.1");

    /* ──────── LOOPING FLOW (fast-forward feel) ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.15, delay: 0.5 });
    loopTlRef.current = loop;

    /* S3 → SQLite */
    const p1 = svg.querySelector<SVGPathElement>(".path-s3-sqlite");
    const d1 = svg.querySelector<SVGCircleElement>(".dot-s3-sqlite");
    if (p1 && d1) animateDot(d1, p1, loop, 0.25, 0);

    /* SQLite → Dispatcher */
    const p2 = svg.querySelector<SVGPathElement>(".path-sqlite-disp");
    const d2 = svg.querySelector<SVGCircleElement>(".dot-sqlite-disp");
    if (p2 && d2) animateDot(d2, p2, loop, 0.25, 0.15);

    /* Dispatcher → Engine */
    const p3 = svg.querySelector<SVGPathElement>(".path-disp-engine");
    const d3 = svg.querySelector<SVGCircleElement>(".dot-disp-engine");
    if (p3 && d3) animateDot(d3, p3, loop, 0.25, 0.3);

    /* Internal fan-out (fast) */
    for (let i = 0; i < ENGINE_ITEM_COUNT; i++) {
      const p = svg.querySelector<SVGPathElement>(`.int-path-0-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.int-dot-0-${i}`);
      if (p && d) animateDot(d, p, loop, 0.2, 0.45 + i * 0.02);
    }

    /* Checkmarks */
    const checks = svg.querySelectorAll<SVGElement>(".engine-check");
    loop.fromTo(checks, { opacity: 0, scale: 0, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.15, stagger: 0.02, ease: "back.out(2)" }, 0.55);
    loop.to(checks, { opacity: 0, duration: 0.15 }, "+=0.2");

    /* Engine → Replay OMS */
    const p4 = svg.querySelector<SVGPathElement>(".path-engine-oms");
    const d4 = svg.querySelector<SVGCircleElement>(".dot-engine-oms");
    if (p4 && d4) animateDot(d4, p4, loop, 0.2, 0.7);

    /* Replay OMS → Engine (fills) */
    const p5 = svg.querySelector<SVGPathElement>(".path-oms-engine");
    const d5 = svg.querySelector<SVGCircleElement>(".dot-oms-engine");
    if (p5 && d5) animateDotReverse(d5, p5, loop, 0.2, 0.95);

    /* Clock time advance */
    const clockEl = clockRef.current;
    if (clockEl) {
      const times = ["09:15", "09:30", "10:00", "10:45", "11:30", "12:15", "13:00", "14:00", "14:45", "15:30"];
      let timeIdx = 0;
      loop.to({}, {
        duration: 0.1,
        onComplete: () => {
          timeIdx = (timeIdx + 1) % times.length;
          clockEl.textContent = times[timeIdx];
        },
      }, 0.5);
    }

    loop.to({}, { duration: 0.15 }); // pad

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Replay the Markets, Tick by Tick
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Same engine code, same strategy code — historical data in, simulated results out
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1300px", maxHeight: "calc(100vh - 130px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs><StandardDefs /></defs>
        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ PATHS ═══════════ */}
        <path d={pathS3ToSqlite()} className="ane-path path-s3-sqlite" fill="none" stroke="var(--accent-cyan)" strokeWidth={2} opacity={0.35} />
        <path d={pathSqliteToDispatcher()} className="ane-path path-sqlite-disp" fill="none" stroke="var(--accent-cyan)" strokeWidth={2} opacity={0.35} />
        <path d={pathDispatcherToEngine()} className="ane-path path-disp-engine" fill="none" stroke="var(--accent-cyan)" strokeWidth={2} opacity={0.35} />
        <path d={pathEngineToReplayOms()} className="ane-path path-engine-oms" fill="none" stroke="var(--accent-purple)" strokeWidth={1.5} opacity={0.3} />
        <path d={pathReplayOmsToEngine()} className="ret-path path-oms-engine" fill="none" stroke="var(--accent-green)" strokeWidth={1.2} opacity={0.25} strokeDasharray="6 4" />

        {/* Ghost paths */}
        <path d={pathEngineToGhostAgent()} className="ghost-path" fill="none" stroke="var(--accent-purple)" strokeWidth={1} opacity={0.12} strokeDasharray="4 4" />
        <path d={pathGhostAgentToLLM()} className="ghost-path" fill="none" stroke="var(--accent-purple)" strokeWidth={1} opacity={0.12} strokeDasharray="4 4" />

        {/* ═══════════ NODES ═══════════ */}

        {/* S3 */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={S3.cx - S3.w / 2} y={S3.cy - S3.h / 2} width={S3.w} height={S3.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.2} />
          <text x={S3.cx} y={S3.cy - 6} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">S3</text>
          <text x={S3.cx} y={S3.cy + 12} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Historical Data</text>
        </g>

        {/* SQLite DB */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={SQLITE.cx - SQLITE.w / 2} y={SQLITE.cy - SQLITE.h / 2} width={SQLITE.w} height={SQLITE.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-cyan)" strokeWidth={1.2} />
          <text x={SQLITE.cx} y={SQLITE.cy - 6} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">SQLite DB</text>
          <text x={SQLITE.cx} y={SQLITE.cy + 12} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">.db.zst archives</text>
        </g>

        {/* Backtesting Dispatcher */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={DISPATCHER.cx - DISPATCHER.w / 2} y={DISPATCHER.cy - DISPATCHER.h / 2} width={DISPATCHER.w} height={DISPATCHER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-cyan)" strokeWidth={1.5} />
          <text x={DISPATCHER.cx} y={DISPATCHER.cy - 10} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Backtesting</text>
          <text x={DISPATCHER.cx} y={DISPATCHER.cy + 8} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Dispatcher</text>
          <text x={DISPATCHER.cx} y={DISPATCHER.cy + 26} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">chronological replay</text>
        </g>

        {/* Engine */}
        <EngineBox
          cx={ENGINE.cx} cy={ENGINE.cy} w={ENGINE.w} h={ENGINE.h}
          label="Engine" engineIdx={0}
          badge="Same engine code"
        />

        {/* Simulated time clock overlay */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect x={CLOCK_CX - 50} y={CLOCK_CY - 14} width={100} height={28} rx={6} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1} />
          <text x={CLOCK_CX - 20} y={CLOCK_CY + 4} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">Time:</text>
          <text ref={clockRef} x={CLOCK_CX + 20} y={CLOCK_CY + 4} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-orange)">09:15</text>
        </g>

        {/* "Same strategy code" badge inside engine area */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect
            x={ENGINE.cx - ENGINE.w / 2 + 8} y={ENGINE.cy + ENGINE.h / 2 - 18}
            width={110} height={16} rx={3}
            fill="color-mix(in srgb, var(--accent-green) 15%, transparent)"
            stroke="var(--accent-green)" strokeWidth={0.5}
          />
          <text x={ENGINE.cx - ENGINE.w / 2 + 63} y={ENGINE.cy + ENGINE.h / 2 - 7} textAnchor="middle" className="text-[8px] font-medium" fill="var(--accent-green)">Same strategy code</text>
        </g>

        {/* Replay OMS */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={REPLAY_OMS.cx - REPLAY_OMS.w / 2} y={REPLAY_OMS.cy - REPLAY_OMS.h / 2} width={REPLAY_OMS.w} height={REPLAY_OMS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.2} />
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy - 8} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Replay OMS</text>
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy + 10} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">slippage simulation</text>
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy + 24} textAnchor="middle" className="text-[9px]" fill="var(--accent-orange)" opacity={0.7}>simulated fills</text>
        </g>

        {/* Ghosted AI Agent */}
        <g className="ghost-node" style={{ opacity: 0 }}>
          <rect x={GHOST_AGENT.cx - GHOST_AGENT.w / 2} y={GHOST_AGENT.cy - GHOST_AGENT.h / 2} width={GHOST_AGENT.w} height={GHOST_AGENT.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth={0.8} />
          <text x={GHOST_AGENT.cx} y={GHOST_AGENT.cy + 4} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-purple)">AI Agent</text>
        </g>

        {/* Ghosted LLM */}
        <g className="ghost-node" style={{ opacity: 0 }}>
          <rect x={GHOST_LLM.cx - GHOST_LLM.w / 2} y={GHOST_LLM.cy - GHOST_LLM.h / 2} width={GHOST_LLM.w} height={GHOST_LLM.h} rx={16} fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth={0.8} />
          <text x={GHOST_LLM.cx} y={GHOST_LLM.cy + 4} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-purple)">LLM</text>
        </g>

        {/* Ghost label */}
        <text x={(GHOST_AGENT.cx + GHOST_LLM.cx) / 2} y={GHOST_AGENT.cy + GHOST_AGENT.h / 2 + 20} textAnchor="middle" className="ghost-node text-[9px] italic" fill="var(--accent-purple)" opacity={0}>
          Optional: plug in LLM the same way as live
        </text>

        {/* ═══════════ CALLOUTS ═══════════ */}
        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={DISPATCHER.cx - 65} y={DISPATCHER.cy + DISPATCHER.h / 2 + 10} width={130} height={22} rx={4} fill="color-mix(in srgb, var(--accent-cyan) 15%, transparent)" stroke="var(--accent-cyan)" strokeWidth={0.6} />
          <text x={DISPATCHER.cx} y={DISPATCHER.cy + DISPATCHER.h / 2 + 25} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-cyan)">Simulated time</text>
        </g>

        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={REPLAY_OMS.cx - 55} y={REPLAY_OMS.cy + REPLAY_OMS.h / 2 + 10} width={110} height={22} rx={4} fill="color-mix(in srgb, var(--accent-orange) 15%, transparent)" stroke="var(--accent-orange)" strokeWidth={0.6} />
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy + REPLAY_OMS.h / 2 + 25} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-orange)">Slippage injection</text>
        </g>

        {/* Path labels */}
        <text x={(ENGINE.cx + ENGINE.w / 2 + REPLAY_OMS.cx - REPLAY_OMS.w / 2) / 2} y={REPLAY_OMS.cy - REPLAY_OMS.h / 2 - 8} textAnchor="middle" className="label-node text-[9px]" fill="var(--accent-purple)" opacity={0}>Orders</text>
        <text x={(ENGINE.cx + ENGINE.w / 2 + REPLAY_OMS.cx - REPLAY_OMS.w / 2) / 2} y={ENGINE.cy + ENGINE.h / 2 + 22} textAnchor="middle" className="label-node text-[9px]" fill="var(--accent-green)" opacity={0}>Simulated Fills</text>

        {/* Fast-forward indicator (top right) */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect x={VB_W - 150} y={30} width={120} height={28} rx={6} fill="color-mix(in srgb, var(--accent-cyan) 12%, transparent)" stroke="var(--accent-cyan)" strokeWidth={0.8} />
          <text x={VB_W - 90} y={49} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-cyan)">▶▶ Fast replay</text>
        </g>

        {/* ═══════════ DOTS ═══════════ */}
        <circle className="dot-s3-sqlite" r={5} fill="var(--accent-cyan)" opacity={0} filter="url(#glowCyan)" />
        <circle className="dot-sqlite-disp" r={5} fill="var(--accent-cyan)" opacity={0} filter="url(#glowCyan)" />
        <circle className="dot-disp-engine" r={5} fill="var(--accent-cyan)" opacity={0} filter="url(#glowCyan)" />
        {ENGINE_ITEMS.map((_, i) => (
          <circle key={`id-${i}`} className={`int-dot-0-${i}`} r={3} fill="var(--accent-green)" opacity={0} filter="url(#glowGreen)" />
        ))}
        <circle className="dot-engine-oms" r={4} fill="var(--accent-purple)" opacity={0} filter="url(#glowPurple)" />
        <circle className="dot-oms-engine" r={4} fill="var(--accent-green)" opacity={0} filter="url(#glowGreen)" />
      </svg>
    </SlideLayout>
  );
}
