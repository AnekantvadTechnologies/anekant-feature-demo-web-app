import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { EngineBox, ENGINE_ITEM_COUNT } from "./shared/engine-box";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  LLMFlowSlide - AI Agent Integration
 *  
 *  Clean two-loop layout:
 *    FAST LOOP (top): Exchange → Redis → Engine → Broker
 *    SLOW LOOP (bottom): Engine → Metrics → Agent → LLM → back to Engine
 *  
 *  No crossing paths - clear visual separation between loops
 * ================================================================ */

interface LLMFlowSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  Layout - Reorganized for clean non-overlapping paths
 * ──────────────────────────────────────────────────────────── */

/* Fast loop row (top) */
const EXCHANGE = { cx: 140, cy: 300, w: 130, h: 70 };
const REDIS = { cx: 340, cy: 300, w: 150, h: 100 };

const ENGINE_W = 300;
const ENGINE_H = 200;
const ENGINE = { cx: 620, cy: 300, w: ENGINE_W, h: ENGINE_H };

const BROKER = { cx: 920, cy: 300, w: 130, h: 70 };

/* Slow loop row (bottom) - stacked vertically, then flows right */
const METRICS_DB = { cx: 340, cy: 580, w: 150, h: 60 };
const METRICS_API = { cx: 340, cy: 680, w: 150, h: 60 };

/* AI Agent - positioned to the right, below Broker */
const AGENT = { cx: 750, cy: 650, w: 220, h: 160 };

/* LLM - right of Agent */
const LLM = { cx: 1050, cy: 650, w: 160, h: 90 };

/* Agent sub-items */
const AGENT_ITEMS = ["Fetch Metrics", "Generate Charts", "Build Prompt"];

/* ────────────────────────────────────────────────────────────
 *  Path builders - Clean non-crossing paths
 * ──────────────────────────────────────────────────────────── */

/* Fast loop paths */
const pathExToRedis = () =>
  bezierH(EXCHANGE.cx + EXCHANGE.w / 2, EXCHANGE.cy, REDIS.cx - REDIS.w / 2, REDIS.cy);

const pathRedisToEngine = () =>
  bezierH(REDIS.cx + REDIS.w / 2, REDIS.cy, ENGINE.cx - ENGINE.w / 2, ENGINE.cy);

const pathEngineToBroker = () =>
  bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy, BROKER.cx - BROKER.w / 2, BROKER.cy);

const pathBrokerToEngine = (): string => {
  const x1 = BROKER.cx - BROKER.w / 2;
  const y1 = BROKER.cy + 25;
  const x2 = ENGINE.cx + ENGINE.w / 2;
  const y2 = ENGINE.cy + 25;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 40}, ${cpx} ${y2 + 40}, ${x2} ${y2}`;
};

/* Engine to Metrics DB - vertical drop */
const pathEngineToMetricsDB = (): string => {
  const x1 = ENGINE.cx - 60;
  const y1 = ENGINE.cy + ENGINE.h / 2;
  const x2 = METRICS_DB.cx + METRICS_DB.w / 2;
  const y2 = METRICS_DB.cy;
  return `M ${x1} ${y1} C ${x1} ${y1 + 80}, ${x2 + 40} ${y2 - 40}, ${x2} ${y2}`;
};

/* Metrics DB to API - vertical */
const pathDBToAPI = (): string => {
  return `M ${METRICS_DB.cx} ${METRICS_DB.cy + METRICS_DB.h / 2} L ${METRICS_API.cx} ${METRICS_API.cy - METRICS_API.h / 2}`;
};

/* Metrics API to Agent - horizontal curve */
const pathAPIToAgent = () =>
  bezierH(METRICS_API.cx + METRICS_API.w / 2, METRICS_API.cy, AGENT.cx - AGENT.w / 2, AGENT.cy);

/* Agent to LLM */
const pathAgentToLLM = () =>
  bezierH(AGENT.cx + AGENT.w / 2, AGENT.cy - 20, LLM.cx - LLM.w / 2, LLM.cy);

/* LLM response back to Agent */
const pathLLMToAgent = (): string => {
  const x1 = LLM.cx - LLM.w / 2;
  const y1 = LLM.cy + 25;
  const x2 = AGENT.cx + AGENT.w / 2;
  const y2 = AGENT.cy + 25;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cpx} ${y1 + 35}, ${cpx} ${y2 + 35}, ${x2} ${y2}`;
};

/* Agent commands back to Engine - goes UP and LEFT, no crossing */
const pathAgentToEngine = (): string => {
  const x1 = AGENT.cx;
  const y1 = AGENT.cy - AGENT.h / 2;
  const x2 = ENGINE.cx + 60;
  const y2 = ENGINE.cy + ENGINE.h / 2;
  return `M ${x1} ${y1} C ${x1} ${y1 - 60}, ${x2} ${y2 + 60}, ${x2} ${y2}`;
};

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

    const reveal = gsap.timeline();
    revealTlRef.current = reveal;

    const allPaths = svg.querySelectorAll<SVGPathElement>(".ane-path, .int-path, .ret-path, .slow-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    const nodes = svg.querySelectorAll(".ane-node");
    reveal.fromTo(nodes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }, "-=0.2");

    reveal.to(allPaths, { opacity: 0.35, strokeDashoffset: 0, duration: 0.6, stagger: 0.02, ease: "power1.inOut" });

    const items = svg.querySelectorAll(".engine-item, .agent-item");
    reveal.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" }, "-=0.3");

    const labels = svg.querySelectorAll(".label-node");
    reveal.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.04 }, "-=0.2");

    /* Fast loop */
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

    const pe2b = svg.querySelector<SVGPathElement>(".path-engine-broker");
    const de2b = svg.querySelector<SVGCircleElement>(".dot-engine-broker");
    if (pe2b && de2b) animateDot(de2b, pe2b, fast, 0.3, 0.9);

    const pb2e = svg.querySelector<SVGPathElement>(".path-broker-engine");
    const db2e = svg.querySelector<SVGCircleElement>(".dot-broker-engine");
    if (pb2e && db2e) animateDotReverse(db2e, pb2e, fast, 0.3, 1.3);

    const pdb = svg.querySelector<SVGPathElement>(".path-engine-db");
    const ddb = svg.querySelector<SVGCircleElement>(".dot-engine-db");
    if (pdb && ddb) animateDot(ddb, pdb, fast, 0.3, 0.8);

    fast.to({}, { duration: 0.3 });

    /* Slow loop */
    const slow = gsap.timeline({ repeat: -1, repeatDelay: 1.0, paused: true });
    slowLoopRef.current = slow;

    reveal.eventCallback("onComplete", () => {
      fast.play();
      slow.delay(0.5).play();
    });

    const pDbApi = svg.querySelector<SVGPathElement>(".path-db-api");
    const dDbApi = svg.querySelector<SVGCircleElement>(".dot-db-api");
    if (pDbApi && dDbApi) animateDot(dDbApi, pDbApi, slow, 0.4, 0);

    const pApiAgent = svg.querySelector<SVGPathElement>(".path-api-agent");
    const dApiAgent = svg.querySelector<SVGCircleElement>(".dot-api-agent");
    if (pApiAgent && dApiAgent) animateDot(dApiAgent, pApiAgent, slow, 0.5, 0.3);

    const agentItems = svg.querySelectorAll<SVGElement>(".agent-item-highlight");
    slow.fromTo(agentItems, { opacity: 0.3 }, { opacity: 1, duration: 0.3, stagger: 0.25, ease: "power1.inOut" }, 0.7);
    slow.to(agentItems, { opacity: 0.3, duration: 0.2, stagger: 0.1 }, "+=0.3");

    const pAgentLlm = svg.querySelector<SVGPathElement>(".path-agent-llm");
    const dAgentLlm = svg.querySelector<SVGCircleElement>(".dot-agent-llm");
    if (pAgentLlm && dAgentLlm) animateDot(dAgentLlm, pAgentLlm, slow, 0.4, 1.6);

    const llmBox = svg.querySelector<SVGElement>(".llm-box");
    if (llmBox) {
      slow.to(llmBox, { attr: { strokeWidth: 3.6 }, duration: 0.3, ease: "power1.inOut" }, 2.0);
      slow.to(llmBox, { attr: { strokeWidth: 1.4 }, duration: 0.3 }, "+=0.4");
    }

    const pLlmAgent = svg.querySelector<SVGPathElement>(".path-llm-agent");
    const dLlmAgent = svg.querySelector<SVGCircleElement>(".dot-llm-agent");
    if (pLlmAgent && dLlmAgent) animateDot(dLlmAgent, pLlmAgent, slow, 0.4, 2.7);

    const pAgentEngine = svg.querySelector<SVGPathElement>(".path-agent-engine");
    const dAgentEngine = svg.querySelector<SVGCircleElement>(".dot-agent-engine");
    if (pAgentEngine && dAgentEngine) animateDot(dAgentEngine, pAgentEngine, slow, 0.5, 3.1);

    slow.to({}, { duration: 0.5 });

    return () => {
      reveal.kill();
      fast.kill();
      slow.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          AI Agent Integration
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          LLM-powered decision making in real-time
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

        {/* ═══════════ FAST LOOP LABEL ═══════════ */}
        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={50} y={180} width={180} height={30} rx={6} fill="color-mix(in srgb, var(--accent-amber) 15%, transparent)" stroke="var(--accent-amber)" strokeWidth={1} />
          <text x={140} y={201} textAnchor="middle" className="text-[13px] font-bold uppercase tracking-wide" fill="var(--accent-amber)">Fast Loop (ticks)</text>
        </g>

        {/* ═══════════ SLOW LOOP LABEL ═══════════ */}
        <g className="label-node" style={{ opacity: 0 }}>
          <rect x={50} y={490} width={200} height={30} rx={6} fill="color-mix(in srgb, var(--accent-coral) 15%, transparent)" stroke="var(--accent-coral)" strokeWidth={1} />
          <text x={150} y={511} textAnchor="middle" className="text-[13px] font-bold uppercase tracking-wide" fill="var(--accent-coral)">Slow Loop (~30-60s)</text>
        </g>

        {/* ═══════════ FAST-LOOP PATHS ═══════════ */}
        <path d={pathExToRedis()} className="ane-path path-ex-redis" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} />
        <path d={pathRedisToEngine()} className="ane-path path-redis-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2.4} />
        <path d={pathEngineToBroker()} className="ane-path path-engine-broker" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathBrokerToEngine()} className="ret-path path-broker-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="7 5" />

        {/* ═══════════ SLOW-LOOP PATHS ═══════════ */}
        <path d={pathEngineToMetricsDB()} className="slow-path path-engine-db" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} strokeDasharray="5 4" />
        <path d={pathDBToAPI()} className="slow-path path-db-api" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} />
        <path d={pathAPIToAgent()} className="slow-path path-api-agent" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} />
        <path d={pathAgentToLLM()} className="slow-path path-agent-llm" fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} />
        <path d={pathLLMToAgent()} className="slow-path path-llm-agent" fill="none" stroke="var(--accent-coral)" strokeWidth={1.5} strokeDasharray="7 5" />
        <path d={pathAgentToEngine()} className="slow-path path-agent-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.8} />

        {/* ═══════════ FAST LOOP NODES ═══════════ */}

        {/* Exchange */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={EXCHANGE.cx - EXCHANGE.w / 2} y={EXCHANGE.cy - EXCHANGE.h / 2} width={EXCHANGE.w} height={EXCHANGE.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={EXCHANGE.cx} y={EXCHANGE.cy + 5} textAnchor="middle" className="text-[15px] font-bold" fill="var(--text-primary)">Exchange</text>
        </g>

        {/* Redis */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={REDIS.cx - REDIS.w / 2} y={REDIS.cy - REDIS.h / 2} width={REDIS.w} height={REDIS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.4} />
          <text x={REDIS.cx} y={REDIS.cy - 12} textAnchor="middle" className="text-[15px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={REDIS.cx} y={REDIS.cy + 8} textAnchor="middle" className="text-[15px] font-bold" fill="var(--text-primary)">Streams</text>
          <text x={REDIS.cx} y={REDIS.cy + 28} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">ticks + commands</text>
        </g>

        {/* Engine */}
        <EngineBox cx={ENGINE.cx} cy={ENGINE.cy} w={ENGINE.w} h={ENGINE.h} label="Engine" engineIdx={0} />

        {/* Broker */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={BROKER.cx - BROKER.w / 2} y={BROKER.cy - BROKER.h / 2} width={BROKER.w} height={BROKER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={BROKER.cx} y={BROKER.cy + 5} textAnchor="middle" className="text-[15px] font-bold" fill="var(--text-primary)">Broker</text>
        </g>

        {/* Path labels for fast loop */}
        <text x={(ENGINE.cx + ENGINE.w / 2 + BROKER.cx - BROKER.w / 2) / 2} y={BROKER.cy - 45} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-coral)" style={{ opacity: 0 }}>Orders</text>
        <text x={(ENGINE.cx + ENGINE.w / 2 + BROKER.cx - BROKER.w / 2) / 2} y={BROKER.cy + 55} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0 }}>Fills</text>

        {/* ═══════════ SLOW LOOP NODES ═══════════ */}

        {/* Metrics DB */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={METRICS_DB.cx - METRICS_DB.w / 2} y={METRICS_DB.cy - METRICS_DB.h / 2} width={METRICS_DB.w} height={METRICS_DB.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={METRICS_DB.cx} y={METRICS_DB.cy - 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Metrics DB</text>
          <text x={METRICS_DB.cx} y={METRICS_DB.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">SQLite</text>
        </g>

        {/* Metrics API */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={METRICS_API.cx - METRICS_API.w / 2} y={METRICS_API.cy - METRICS_API.h / 2} width={METRICS_API.w} height={METRICS_API.h} rx={10} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={METRICS_API.cx} y={METRICS_API.cy - 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Metrics API</text>
          <text x={METRICS_API.cx} y={METRICS_API.cy + 14} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">FastAPI sidecar</text>
        </g>

        {/* AI Agent */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect x={AGENT.cx - AGENT.w / 2} y={AGENT.cy - AGENT.h / 2} width={AGENT.w} height={AGENT.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.8} />
          <text x={AGENT.cx} y={AGENT.cy - AGENT.h / 2 + 24} textAnchor="middle" className="text-[15px] font-bold" fill="var(--accent-coral)">AI Agent</text>

          {AGENT_ITEMS.map((label, i) => {
            const iy = AGENT.cy - 30 + i * 38;
            return (
              <g key={`ai-${i}`} className="agent-item" style={{ opacity: 0 }}>
                <rect
                  x={AGENT.cx - 90} y={iy - 12} width={180} height={27} rx={6}
                  className="agent-item-highlight"
                  fill="var(--bg-secondary)" stroke="var(--accent-coral)" strokeWidth={1} opacity={0.35}
                />
                <text x={AGENT.cx} y={iy + 5} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-coral)">{label}</text>
              </g>
            );
          })}
        </g>

        {/* LLM */}
        <g className="ane-node" style={{ opacity: 0 }}>
          <rect className="llm-box" x={LLM.cx - LLM.w / 2} y={LLM.cy - LLM.h / 2} width={LLM.w} height={LLM.h} rx={20} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={LLM.cx} y={LLM.cy - 15} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-coral)">LLM</text>
          <text x={LLM.cx} y={LLM.cy + 8} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Gemini / Claude</text>
          <text x={LLM.cx} y={LLM.cy + 26} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">structured response</text>
        </g>

        {/* Commands label */}
        <text x={AGENT.cx + 30} y={AGENT.cy - AGENT.h / 2 - 15} textAnchor="middle" className="label-node text-[11px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0 }}>commands</text>

        {/* ═══════════ DOTS ═══════════ */}

        {/* Fast loop dots */}
        <circle className="dot-ex-redis" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-redis-engine" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        {ENGINE_ITEMS.map((_, i) => (
          <circle key={`id-${i}`} className={`int-dot-0-${i}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
        <circle className="dot-engine-broker" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-broker-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />

        {/* Slow loop dots */}
        <circle className="dot-engine-db" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-db-api" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-api-agent" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-agent-llm" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-llm-agent" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-agent-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
      </svg>
    </SlideLayout>
  );
}
