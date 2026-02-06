import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  BacktestingFlowSlide - Warm Industrial Aesthetic
 *  SCALED 20% LARGER - NO blue/purple colors
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
 *  Layout constants — AI Agent fully integrated in backtest (scaled 20%)
 * ──────────────────────────────────────────────────────────── */
const S3 = { cx: 96, cy: 360, w: 132, h: 70 };
const SQLITE = { cx: 288, cy: 360, w: 144, h: 70 };
const DISPATCHER = { cx: 504, cy: 360, w: 186, h: 86 };

const ENGINE_W = 288;
const ENGINE_H = 204;
const ENGINE = { cx: 792, cy: 360, w: ENGINE_W, h: ENGINE_H };

const REPLAY_OMS = { cx: 1140, cy: 360, w: 168, h: 86 };

/* Clock overlay position (over the engine) */
const CLOCK_CX = ENGINE.cx + ENGINE.w / 2 - 36;
const CLOCK_CY = ENGINE.cy - ENGINE.h / 2 - 24;

/* AI Agent and LLM — Full integration, not ghosted */
const AGENT = { cx: 984, cy: 648, w: 192, h: 132 };
const LLM = { cx: 1248, cy: 648, w: 144, h: 84 };

/* ────────────────────────────────────────────────────────────
 *  Path builders — Including full Agent/LLM integration
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
  const y1 = REPLAY_OMS.cy + 26;
  const x2 = ENGINE.cx + ENGINE.w / 2;
  const y2 = ENGINE.cy + 30;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 42}, ${cpx} ${y2 + 42}, ${x2} ${y2}`;
};

/* Agent integration paths — full visibility */
const pathEngineToAgent = (): string => {
  const x1 = ENGINE.cx + 36;
  const y1 = ENGINE.cy + ENGINE.h / 2;
  const x2 = AGENT.cx - AGENT.w / 2;
  const y2 = AGENT.cy - 24;
  return `M ${x1} ${y1} C ${x1} ${y1 + 60}, ${x2 - 48} ${y2}, ${x2} ${y2}`;
};

const pathAgentToLLM = () =>
  bezierH(AGENT.cx + AGENT.w / 2, AGENT.cy, LLM.cx - LLM.w / 2, LLM.cy);

const pathLLMToAgent = (): string => {
  const x1 = LLM.cx - LLM.w / 2;
  const y1 = LLM.cy + 24;
  const x2 = AGENT.cx + AGENT.w / 2;
  const y2 = AGENT.cy + 24;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 30}, ${cpx} ${y2 + 30}, ${x2} ${y2}`;
};



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

    /* ──────── REVEAL (refined, subtle animations) ──────── */
    const reveal = gsap.timeline();
    revealTlRef.current = reveal;

    /* Set ALL paths invisible initially (fixes lines-before-boxes issue) */
    const allPaths = svg.querySelectorAll<SVGPathElement>(".ane-path, .int-path, .ret-path, .slow-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    /* Title */
    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    /* Nodes (boxes first) */
    const nodes = svg.querySelectorAll(".ane-node");
    reveal.fromTo(nodes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }, "-=0.2");

    /* Paths (after nodes, with opacity) */
    reveal.to(allPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Internal items */
    const items = svg.querySelectorAll(".engine-item");
    reveal.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" }, "-=0.3");

    /* Badges */
    const badges = svg.querySelectorAll(".badge-node");
    reveal.fromTo(badges, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }, "-=0.2");

    /* Labels */
    const labels = svg.querySelectorAll(".label-node");
    reveal.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.04 }, "-=0.1");

    /* ──────── LOOPING FLOW (fast-forward feel, starts after reveal) ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.15, paused: true });
    loopTlRef.current = loop;

    /* Start loop only after reveal finishes */
    reveal.eventCallback("onComplete", () => {
      loop.play();
    });

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

    /* Checkmarks - subtle */
    const checks = svg.querySelectorAll<SVGElement>(".engine-check");
    loop.fromTo(checks, { opacity: 0, scale: 0.8, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.15, stagger: 0.03, ease: "power2.out" }, 0.55);
    loop.to(checks, { opacity: 0, duration: 0.15 }, "+=0.15");

    /* Engine → Replay OMS */
    const p4 = svg.querySelector<SVGPathElement>(".path-engine-oms");
    const d4 = svg.querySelector<SVGCircleElement>(".dot-engine-oms");
    if (p4 && d4) animateDot(d4, p4, loop, 0.2, 0.7);

    /* Replay OMS → Engine (fills) */
    const p5 = svg.querySelector<SVGPathElement>(".path-oms-engine");
    const d5 = svg.querySelector<SVGCircleElement>(".dot-oms-engine");
    if (p5 && d5) animateDotReverse(d5, p5, loop, 0.2, 0.95);

    /* Engine → Agent (integrated AI flow) */
    const pEngAgent = svg.querySelector<SVGPathElement>(".path-engine-agent");
    const dEngAgent = svg.querySelector<SVGCircleElement>(".dot-engine-agent");
    if (pEngAgent && dEngAgent) animateDot(dEngAgent, pEngAgent, loop, 0.25, 0.8);

    /* Agent → LLM */
    const pAgentLlm = svg.querySelector<SVGPathElement>(".path-agent-llm");
    const dAgentLlm = svg.querySelector<SVGCircleElement>(".dot-agent-llm");
    if (pAgentLlm && dAgentLlm) animateDot(dAgentLlm, pAgentLlm, loop, 0.2, 1.0);

    /* LLM → Agent (response back) */
    const pLlmAgent = svg.querySelector<SVGPathElement>(".path-llm-agent");
    const dLlmAgent = svg.querySelector<SVGCircleElement>(".dot-llm-agent");
    if (pLlmAgent && dLlmAgent) animateDot(dLlmAgent, pLlmAgent, loop, 0.2, 1.25);

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

    loop.to({}, { duration: 0.2 }); // pad

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-8">
      <div ref={titleRef} className="mb-4 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Replay the Markets, Tick by Tick
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Same engine, same strategy, same AI agent — historical data in, simulated results out
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1560px", maxHeight: "calc(100vh - 156px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs><StandardDefs /></defs>
        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ PATHS ═══════════ */}
        <path d={pathS3ToSqlite()} className="ane-path path-s3-sqlite" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />
        <path d={pathSqliteToDispatcher()} className="ane-path path-sqlite-disp" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />
        <path d={pathDispatcherToEngine()} className="ane-path path-disp-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />
        <path d={pathEngineToReplayOms()} className="ane-path path-engine-oms" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.35} />
        <path d={pathReplayOmsToEngine()} className="ret-path path-oms-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.4} opacity={0.3} strokeDasharray="7 5" />

        {/* Agent/LLM paths — fully integrated */}
        <path d={pathEngineToAgent()} className="slow-path path-engine-agent" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.3} />
        <path d={pathAgentToLLM()} className="slow-path path-agent-llm" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.3} />
        <path d={pathLLMToAgent()} className="slow-path path-llm-agent" fill="none" stroke="var(--accent-coral)" strokeWidth={1.4} opacity={0.25} strokeDasharray="7 5" />

        {/* ═══════════ NODES ═══════════ */}

        {/* S3 */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={S3.cx - S3.w / 2} y={S3.cy - S3.h / 2} width={S3.w} height={S3.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={S3.cx} y={S3.cy - 7} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">S3</text>
          <text x={S3.cx} y={S3.cy + 14} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Historical Data</text>
        </g>

        {/* SQLite DB */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={SQLITE.cx - SQLITE.w / 2} y={SQLITE.cy - SQLITE.h / 2} width={SQLITE.w} height={SQLITE.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.4} />
          <text x={SQLITE.cx} y={SQLITE.cy - 7} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">SQLite DB</text>
          <text x={SQLITE.cx} y={SQLITE.cy + 14} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">.db.zst archives</text>
        </g>

        {/* Backtesting Dispatcher */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={DISPATCHER.cx - DISPATCHER.w / 2} y={DISPATCHER.cy - DISPATCHER.h / 2} width={DISPATCHER.w} height={DISPATCHER.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.8} />
          <text x={DISPATCHER.cx} y={DISPATCHER.cy - 12} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Backtesting</text>
          <text x={DISPATCHER.cx} y={DISPATCHER.cy + 10} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Dispatcher</text>
          <text x={DISPATCHER.cx} y={DISPATCHER.cy + 31} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">chronological replay</text>
        </g>

        {/* Engine */}
        <EngineBox
          cx={ENGINE.cx} cy={ENGINE.cy} w={ENGINE.w} h={ENGINE.h}
          label="Engine" engineIdx={0}
          badge="Same engine code"
        />

        {/* Simulated time clock overlay */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect x={CLOCK_CX - 60} y={CLOCK_CY - 17} width={120} height={34} rx={7} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.2} />
          <text x={CLOCK_CX - 24} y={CLOCK_CY + 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Time:</text>
          <text ref={clockRef} x={CLOCK_CX + 24} y={CLOCK_CY + 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-orange)">09:15</text>
        </g>

        {/* "Same strategy code" badge inside engine area */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect
            x={ENGINE.cx - ENGINE.w / 2 + 10} y={ENGINE.cy + ENGINE.h / 2 - 22}
            width={132} height={19} rx={4}
            fill="color-mix(in srgb, var(--accent-emerald) 18%, transparent)"
            stroke="var(--accent-emerald)" strokeWidth={0.6}
          />
          <text x={ENGINE.cx - ENGINE.w / 2 + 76} y={ENGINE.cy + ENGINE.h / 2 - 8} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-emerald)">Same strategy code</text>
        </g>

        {/* Replay OMS */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={REPLAY_OMS.cx - REPLAY_OMS.w / 2} y={REPLAY_OMS.cy - REPLAY_OMS.h / 2} width={REPLAY_OMS.w} height={REPLAY_OMS.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy - 10} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Replay OMS</text>
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy + 12} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">slippage simulation</text>
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy + 29} textAnchor="middle" className="text-[11px]" fill="var(--accent-orange)" opacity={0.8}>simulated fills</text>
        </g>

        {/* AI Agent — Fully integrated in backtest */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={AGENT.cx - AGENT.w / 2} y={AGENT.cy - AGENT.h / 2} width={AGENT.w} height={AGENT.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={AGENT.cx} y={AGENT.cy - 24} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-coral)">AI Agent</text>
          <text x={AGENT.cx} y={AGENT.cy + 2} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Same agent code</text>
          <text x={AGENT.cx} y={AGENT.cy + 22} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">as live trading</text>
        </g>

        {/* LLM — Fully integrated in backtest */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={LLM.cx - LLM.w / 2} y={LLM.cy - LLM.h / 2} width={LLM.w} height={LLM.h} rx={19} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={LLM.cx} y={LLM.cy - 7} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-coral)">LLM</text>
          <text x={LLM.cx} y={LLM.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Gemini / Claude</text>
        </g>

        {/* Agent integration badge */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect
            x={AGENT.cx - 102} y={AGENT.cy + AGENT.h / 2 + 10}
            width={204} height={22} rx={5}
            fill="color-mix(in srgb, var(--accent-coral) 15%, transparent)"
            stroke="var(--accent-coral)" strokeWidth={0.6}
          />
          <text x={AGENT.cx} y={AGENT.cy + AGENT.h / 2 + 24} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-coral)">AI Agent runs identically in backtest</text>
        </g>

        {/* ═══════════ CALLOUTS ═══════════ */}
        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={DISPATCHER.cx - 78} y={DISPATCHER.cy + DISPATCHER.h / 2 + 12} width={156} height={26} rx={5} fill="color-mix(in srgb, var(--accent-amber) 18%, transparent)" stroke="var(--accent-amber)" strokeWidth={0.8} />
          <text x={DISPATCHER.cx} y={DISPATCHER.cy + DISPATCHER.h / 2 + 30} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-amber)">Simulated time</text>
        </g>

        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={REPLAY_OMS.cx - 66} y={REPLAY_OMS.cy + REPLAY_OMS.h / 2 + 12} width={132} height={26} rx={5} fill="color-mix(in srgb, var(--accent-orange) 18%, transparent)" stroke="var(--accent-orange)" strokeWidth={0.8} />
          <text x={REPLAY_OMS.cx} y={REPLAY_OMS.cy + REPLAY_OMS.h / 2 + 30} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-orange)">Slippage injection</text>
        </g>

        {/* Path labels */}
        <text x={(ENGINE.cx + ENGINE.w / 2 + REPLAY_OMS.cx - REPLAY_OMS.w / 2) / 2} y={REPLAY_OMS.cy - REPLAY_OMS.h / 2 - 10} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-coral)" opacity={0}>Orders</text>
        <text x={(ENGINE.cx + ENGINE.w / 2 + REPLAY_OMS.cx - REPLAY_OMS.w / 2) / 2} y={ENGINE.cy + ENGINE.h / 2 + 26} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-emerald)" opacity={0}>Simulated Fills</text>

        {/* Fast-forward indicator (top right) */}
        <g className="badge-node" style={{ opacity: 0 }}>
          <rect x={VB_W - 180} y={36} width={144} height={34} rx={7} fill="color-mix(in srgb, var(--accent-amber) 15%, transparent)" stroke="var(--accent-amber)" strokeWidth={1} />
          <text x={VB_W - 108} y={59} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-amber)">▶▶ Fast replay</text>
        </g>

        {/* ═══════════ DOTS ═══════════ */}
        <circle className="dot-s3-sqlite" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-sqlite-disp" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-disp-engine" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        {ENGINE_ITEMS.map((_, i) => (
          <circle key={`id-${i}`} className={`int-dot-0-${i}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
        <circle className="dot-engine-oms" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-oms-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        
        {/* Agent/LLM dots */}
        <circle className="dot-engine-agent" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-agent-llm" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-llm-agent" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
      </svg>
    </SlideLayout>
  );
}
