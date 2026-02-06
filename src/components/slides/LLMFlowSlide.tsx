import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, itemX, itemY, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  LLMFlowSlide - Warm Industrial Aesthetic
 *  SCALED 20% LARGER - NO blue/purple colors
 *
 *  Full-screen diagram showing how the AI Agent works alongside
 *  the engine. Two animation loops:
 *    Fast inner: Exchange → Redis → Engine (every tick, amber)
 *    Slow outer: Engine → Metrics DB → API → Agent → LLM → Agent
 *                → Redis → Engine (coral, ~30-60s cycle)
 *  Plus: Engine → Broker → Fills back (same as slide 1)
 * ================================================================ */

interface LLMFlowSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  Layout constants — Reorganized for integrated Agent flow (scaled 20%)
 * ──────────────────────────────────────────────────────────── */

/* Left side nodes */
const EXCHANGE = { cx: 120, cy: 336, w: 120, h: 70 };
const REDIS = { cx: 324, cy: 336, w: 144, h: 108 };

/* Centre: single engine */
const ENGINE_W = 288;
const ENGINE_H = 204;
const ENGINE = { cx: 588, cy: 336, w: ENGINE_W, h: ENGINE_H };

/* Broker (right of engine, same row) */
const BROKER = { cx: 936, cy: 264, w: 132, h: 74 };

/* Metrics DB (below engine) */
const METRICS_DB = { cx: 504, cy: 624, w: 156, h: 62 };

/* Metrics API (right of DB, leading to Agent) */
const METRICS_API = { cx: 720, cy: 624, w: 144, h: 62 };

/* AI Agent — Now centrally positioned below the main flow */
const AGENT = { cx: 984, cy: 624, w: 216, h: 168 };

/* LLM Cloud — Positioned beside Agent for integrated feel */
const LLM = { cx: 1260, cy: 552, w: 156, h: 96 };

/* Agent sub-items */
const AGENT_ITEMS = ["Fetch Metrics", "Generate Charts", "Build Prompt"];

/* ────────────────────────────────────────────────────────────
 *  Path builders — Updated for new integrated layout
 * ──────────────────────────────────────────────────────────── */
const pathExToRedis = () =>
  bezierH(EXCHANGE.cx + EXCHANGE.w / 2, EXCHANGE.cy, REDIS.cx - REDIS.w / 2, REDIS.cy);

const pathRedisToEngine = () =>
  bezierH(REDIS.cx + REDIS.w / 2, REDIS.cy, ENGINE.cx - ENGINE.w / 2, ENGINE.cy);

const pathEngineToBroker = () =>
  bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy - 36, BROKER.cx - BROKER.w / 2, BROKER.cy);

const pathBrokerToEngine = (): string => {
  const x1 = BROKER.cx - BROKER.w / 2;
  const y1 = BROKER.cy + 22;
  const x2 = ENGINE.cx + ENGINE.w / 2;
  const y2 = ENGINE.cy - 12;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 30}, ${cpx} ${y2 + 24}, ${x2} ${y2}`;
};

const pathEngineToMetricsDB = (): string => {
  const x1 = ENGINE.cx - 36;
  const y1 = ENGINE.cy + ENGINE.h / 2;
  const x2 = METRICS_DB.cx;
  const y2 = METRICS_DB.cy - METRICS_DB.h / 2;
  return `M ${x1} ${y1} C ${x1} ${y1 + 48}, ${x2} ${y2 - 48}, ${x2} ${y2}`;
};

const pathDBToAPI = () =>
  bezierH(METRICS_DB.cx + METRICS_DB.w / 2, METRICS_DB.cy, METRICS_API.cx - METRICS_API.w / 2, METRICS_API.cy);

const pathAPIToAgent = () =>
  bezierH(METRICS_API.cx + METRICS_API.w / 2, METRICS_API.cy, AGENT.cx - AGENT.w / 2, AGENT.cy);

const pathAgentToLLM = () =>
  bezierH(AGENT.cx + AGENT.w / 2, AGENT.cy - 36, LLM.cx - LLM.w / 2, LLM.cy);

/* LLM response back to Agent - path goes FROM LLM TO Agent */
const pathLLMToAgent = (): string => {
  const x1 = LLM.cx - LLM.w / 2;
  const y1 = LLM.cy + 24;
  const x2 = AGENT.cx + AGENT.w / 2;
  const y2 = AGENT.cy + 12;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 36}, ${cpx} ${y2 + 30}, ${x2} ${y2}`;
};

const pathAgentToRedis = (): string => {
  /* Curves from agent left side, around and back up to Redis */
  const x1 = AGENT.cx - AGENT.w / 2;
  const y1 = AGENT.cy + 24;
  const x2 = REDIS.cx + REDIS.w / 2;
  const y2 = REDIS.cy + 36;
  return `M ${x1} ${y1} C ${x1 - 96} ${y1 + 72}, ${x2 + 48} ${y2 + 120}, ${x2} ${y2}`;
};

/* Engine internal fan-out (reuse for single engine) */
function engineInternalPath(itemIdx: number): string {
  const x1 = ENGINE.cx - ENGINE.w / 2 + 24;
  const y1 = ENGINE.cy;
  const x2 = itemX(ENGINE.cx) - 132 / 2;
  const y2 = itemY(ENGINE.cy, ENGINE.h, itemIdx);
  return bezierH(x1, y1, x2, y2);
}

/* ================================================================
 *  Main component
 * ================================================================ */
export function LLMFlowSlide({ active }: LLMFlowSlideProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const fastLoopRef = useRef<gsap.core.Timeline | null>(null);
  const slowLoopRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!active) {
      revealTlRef.current?.pause(0);
      fastLoopRef.current?.pause(0);
      slowLoopRef.current?.pause(0);
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    revealTlRef.current?.kill();
    fastLoopRef.current?.kill();
    slowLoopRef.current?.kill();

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
    reveal.to(allPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.6, stagger: 0.02, ease: "power1.inOut" });

    /* Internal items */
    const items = svg.querySelectorAll(".engine-item, .agent-item");
    reveal.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" }, "-=0.3");

    /* Labels */
    const labels = svg.querySelectorAll(".label-node");
    reveal.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.04 }, "-=0.2");

    /* ──────── FAST LOOP (tick flow, starts after reveal) ──────── */
    const fast = gsap.timeline({ repeat: -1, repeatDelay: 0.2, paused: true });
    fastLoopRef.current = fast;

    const p1 = svg.querySelector<SVGPathElement>(".path-ex-redis");
    const d1 = svg.querySelector<SVGCircleElement>(".dot-ex-redis");
    if (p1 && d1) animateDot(d1, p1, fast, 0.4, 0);

    const p2 = svg.querySelector<SVGPathElement>(".path-redis-engine");
    const d2 = svg.querySelector<SVGCircleElement>(".dot-redis-engine");
    if (p2 && d2) animateDot(d2, p2, fast, 0.35, 0.3);

    for (let i = 0; i < ENGINE_ITEM_COUNT; i++) {
      const p = svg.querySelector<SVGPathElement>(`.int-path-0-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.int-dot-0-${i}`);
      if (p && d) animateDot(d, p, fast, 0.25, 0.55 + i * 0.03);
    }

    const checks = svg.querySelectorAll<SVGElement>(".engine-check");
    fast.fromTo(checks, { opacity: 0, scale: 0.8, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.2, stagger: 0.03, ease: "power2.out" }, 0.75);
    fast.to(checks, { opacity: 0, duration: 0.2 }, "+=0.25");

    /* Tick → Broker → Fill */
    const pe2b = svg.querySelector<SVGPathElement>(".path-engine-broker");
    const de2b = svg.querySelector<SVGCircleElement>(".dot-engine-broker");
    if (pe2b && de2b) animateDot(de2b, pe2b, fast, 0.3, 0.9);

    const pb2e = svg.querySelector<SVGPathElement>(".path-broker-engine");
    const db2e = svg.querySelector<SVGCircleElement>(".dot-broker-engine");
    if (pb2e && db2e) animateDotReverse(db2e, pb2e, fast, 0.3, 1.3);

    /* Metrics DB continuous write */
    const pdb = svg.querySelector<SVGPathElement>(".path-engine-db");
    const ddb = svg.querySelector<SVGCircleElement>(".dot-engine-db");
    if (pdb && ddb) animateDot(ddb, pdb, fast, 0.3, 0.8);

    fast.to({}, { duration: 0.3 }); // pad

    /* ──────── SLOW LOOP (agent cycle, starts after reveal) ──────── */
    const slow = gsap.timeline({ repeat: -1, repeatDelay: 1.0, paused: true });
    slowLoopRef.current = slow;

    /* Start both loops only after reveal finishes */
    reveal.eventCallback("onComplete", () => {
      fast.play();
      slow.delay(0.5).play(); // Slight delay between fast and slow loops
    });

    const pDbApi = svg.querySelector<SVGPathElement>(".path-db-api");
    const dDbApi = svg.querySelector<SVGCircleElement>(".dot-db-api");
    if (pDbApi && dDbApi) animateDot(dDbApi, pDbApi, slow, 0.6, 0);

    const pApiAgent = svg.querySelector<SVGPathElement>(".path-api-agent");
    const dApiAgent = svg.querySelector<SVGCircleElement>(".dot-api-agent");
    if (pApiAgent && dApiAgent) animateDot(dApiAgent, pApiAgent, slow, 0.6, 0.5);

    /* Agent items highlight sequentially */
    const agentItems = svg.querySelectorAll<SVGElement>(".agent-item-highlight");
    slow.fromTo(agentItems, { opacity: 0.3 }, { opacity: 1, duration: 0.3, stagger: 0.25, ease: "power1.inOut" }, 0.9);
    slow.to(agentItems, { opacity: 0.3, duration: 0.2, stagger: 0.1 }, "+=0.3");

    const pAgentLlm = svg.querySelector<SVGPathElement>(".path-agent-llm");
    const dAgentLlm = svg.querySelector<SVGCircleElement>(".dot-agent-llm");
    if (pAgentLlm && dAgentLlm) animateDot(dAgentLlm, pAgentLlm, slow, 0.5, 1.8);

    /* LLM "thinking" pulse */
    const llmBox = svg.querySelector<SVGElement>(".llm-box");
    if (llmBox) {
      slow.to(llmBox, { attr: { strokeWidth: 3.6 }, duration: 0.3, ease: "power1.inOut" }, 2.2);
      slow.to(llmBox, { attr: { strokeWidth: 1.4 }, duration: 0.3 }, "+=0.5");
    }

    /* LLM response back to Agent - use forward animation since path goes LLM → Agent */
    const pLlmAgent = svg.querySelector<SVGPathElement>(".path-llm-agent");
    const dLlmAgent = svg.querySelector<SVGCircleElement>(".dot-llm-agent");
    if (pLlmAgent && dLlmAgent) animateDot(dLlmAgent, pLlmAgent, slow, 0.5, 3.0);

    const pAgentRedis = svg.querySelector<SVGPathElement>(".path-agent-redis");
    const dAgentRedis = svg.querySelector<SVGCircleElement>(".dot-agent-redis");
    if (pAgentRedis && dAgentRedis) animateDot(dAgentRedis, pAgentRedis, slow, 0.8, 3.5);

    slow.to({}, { duration: 0.5 }); // pad

    return () => {
      reveal.kill();
      fast.kill();
      slow.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-8">
      <div ref={titleRef} className="mb-4 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          AI-Driven Strategy with LLM
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Two loops: fast ticks (every ms) + slow agent cycle (~30-60s)
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

        {/* ═══════════ FAST-LOOP PATHS (amber / emerald) ═══════════ */}
        <path d={pathExToRedis()} className="ane-path path-ex-redis" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />
        <path d={pathRedisToEngine()} className="ane-path path-redis-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} opacity={0.4} />
        <path d={pathEngineToBroker()} className="ane-path path-engine-broker" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.35} />
        <path d={pathBrokerToEngine()} className="ret-path path-broker-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.4} opacity={0.3} strokeDasharray="7 5" />
        <path d={pathEngineToMetricsDB()} className="ane-path path-engine-db" fill="none" stroke="var(--accent-amber)" strokeWidth={1.8} opacity={0.35} strokeDasharray="5 4" />

        {/* ═══════════ SLOW-LOOP PATHS (coral) ═══════════ */}
        <path d={pathDBToAPI()} className="slow-path path-db-api" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.3} />
        <path d={pathAPIToAgent()} className="slow-path path-api-agent" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.3} />
        <path d={pathAgentToLLM()} className="slow-path path-agent-llm" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.3} />
        <path d={pathLLMToAgent()} className="slow-path path-llm-agent" fill="none" stroke="var(--accent-coral)" strokeWidth={1.4} opacity={0.25} strokeDasharray="7 5" />
        <path d={pathAgentToRedis()} className="slow-path path-agent-redis" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} opacity={0.3} />

        {/* ═══════════ NODES ═══════════ */}

        {/* Exchange */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={EXCHANGE.cx - EXCHANGE.w / 2} y={EXCHANGE.cy - EXCHANGE.h / 2} width={EXCHANGE.w} height={EXCHANGE.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={EXCHANGE.cx} y={EXCHANGE.cy - 5} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Exchange</text>
          <text x={EXCHANGE.cx} y={EXCHANGE.cy + 17} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">NSE / BSE</text>
        </g>

        {/* Redis */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={REDIS.cx - REDIS.w / 2} y={REDIS.cy - REDIS.h / 2} width={REDIS.w} height={REDIS.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={REDIS.cx} y={REDIS.cy - 14} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={REDIS.cx} y={REDIS.cy + 7} textAnchor="middle" className="text-[16px] font-bold" fill="var(--text-primary)">Streams</text>
          <text x={REDIS.cx} y={REDIS.cy + 29} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">ticks + commands</text>
        </g>

        {/* Engine (single, larger) */}
        <EngineBox cx={ENGINE.cx} cy={ENGINE.cy} w={ENGINE.w} h={ENGINE.h} label="Engine" engineIdx={0} />

        {/* Broker */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={BROKER.cx - BROKER.w / 2} y={BROKER.cy - BROKER.h / 2} width={BROKER.w} height={BROKER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={BROKER.cx} y={BROKER.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Broker</text>
          <text x={BROKER.cx} y={BROKER.cy + 17} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Kite / XTS</text>
        </g>

        {/* Metrics DB */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={METRICS_DB.cx - METRICS_DB.w / 2} y={METRICS_DB.cy - METRICS_DB.h / 2} width={METRICS_DB.w} height={METRICS_DB.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={METRICS_DB.cx} y={METRICS_DB.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Metrics DB</text>
          <text x={METRICS_DB.cx} y={METRICS_DB.cy + 17} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">SQLite</text>
        </g>

        {/* Metrics API */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={METRICS_API.cx - METRICS_API.w / 2} y={METRICS_API.cy - METRICS_API.h / 2} width={METRICS_API.w} height={METRICS_API.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={METRICS_API.cx} y={METRICS_API.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Metrics API</text>
          <text x={METRICS_API.cx} y={METRICS_API.cy + 17} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">FastAPI sidecar</text>
        </g>

        {/* AI Agent */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={AGENT.cx - AGENT.w / 2} y={AGENT.cy - AGENT.h / 2} width={AGENT.w} height={AGENT.h} rx={17} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.8} />
          <text x={AGENT.cx - AGENT.w / 2 + 19} y={AGENT.cy - AGENT.h / 2 + 26} className="text-[16px] font-bold" fill="var(--accent-coral)">AI Agent</text>

          {AGENT_ITEMS.map((label, i) => {
            const iy = AGENT.cy - 36 + i * 41;
            return (
              <g key={`ai-${i}`} className="agent-item" style={{ opacity: 0 }}>
                <rect
                  x={AGENT.cx - 96} y={iy - 13} width={192} height={29} rx={7}
                  className="agent-item-highlight"
                  fill="var(--bg-secondary)" stroke="var(--accent-coral)" strokeWidth={1} opacity={0.35}
                />
                <text x={AGENT.cx} y={iy + 5} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-coral)">{label}</text>
              </g>
            );
          })}
        </g>

        {/* LLM Cloud */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect className="llm-box" x={LLM.cx - LLM.w / 2} y={LLM.cy - LLM.h / 2} width={LLM.w} height={LLM.h} rx={24} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={LLM.cx} y={LLM.cy - 17} textAnchor="middle" className="text-[17px] font-bold" fill="var(--accent-coral)">LLM</text>
          <text x={LLM.cx} y={LLM.cy + 7} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Gemini / Claude</text>
          <text x={LLM.cx} y={LLM.cy + 26} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">structured response</text>
        </g>

        {/* ═══════════ SPEED CALLOUTS ═══════════ */}
        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={102} y={516} width={120} height={26} rx={5} fill="color-mix(in srgb, var(--accent-amber) 18%, transparent)" stroke="var(--accent-amber)" strokeWidth={0.8} />
          <text x={162} y={534} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-amber)">Every tick</text>
        </g>
        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={AGENT.cx - 66} y={AGENT.cy + AGENT.h / 2 + 12} width={132} height={26} rx={5} fill="color-mix(in srgb, var(--accent-coral) 18%, transparent)" stroke="var(--accent-coral)" strokeWidth={0.8} />
          <text x={AGENT.cx} y={AGENT.cy + AGENT.h / 2 + 30} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-coral)">~30-60s cycle</text>
        </g>

        {/* Path labels */}
        <text x={(ENGINE.cx + ENGINE.w / 2 + BROKER.cx - BROKER.w / 2) / 2} y={BROKER.cy - BROKER.h / 2 - 7} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-coral)" opacity={0}>Orders</text>
        <text x={(ENGINE.cx + ENGINE.w / 2 + BROKER.cx - BROKER.w / 2) / 2} y={ENGINE.cy + 10} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-emerald)" opacity={0}>Fills</text>
        <text x={ENGINE.cx - 24} y={(ENGINE.cy + ENGINE.h / 2 + METRICS_DB.cy - METRICS_DB.h / 2) / 2} textAnchor="middle" className="label-node text-[11px]" fill="var(--text-muted)" opacity={0}>continuous write</text>
        <text x={AGENT.cx + AGENT.w / 2 + 24} y={AGENT.cy + AGENT.h / 2 + 7} textAnchor="start" className="label-node text-[11px] font-medium" fill="var(--accent-coral)" opacity={0}>commands</text>

        {/* ═══════════ DOTS ═══════════ */}

        {/* Fast loop dots */}
        <circle className="dot-ex-redis" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-redis-engine" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        {ENGINE_ITEMS.map((_, i) => (
          <circle key={`id-${i}`} className={`int-dot-0-${i}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
        <circle className="dot-engine-broker" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-broker-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        <circle className="dot-engine-db" r={4} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />

        {/* Slow loop dots */}
        <circle className="dot-db-api" r={6} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-api-agent" r={6} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-agent-llm" r={6} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-llm-agent" r={6} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-agent-redis" r={6} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
      </svg>
    </SlideLayout>
  );
}
