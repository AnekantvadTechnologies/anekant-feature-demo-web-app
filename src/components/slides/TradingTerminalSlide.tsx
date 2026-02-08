import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  TradingTerminalSlide - "Power Any Trading Interface"
 *
 *  Shows the engine as the foundation powering multiple interfaces:
 *    - Command Center Web App (top-left)
 *    - AI Agent (top-right)
 *    - Mobile App (bottom-left, future)
 *    - Custom Trading Desk (bottom-right, future)
 *
 *  Engine sits at center with bidirectional data flows.
 * ================================================================ */

interface TradingTerminalSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_X = VB_W / 2;
const CENTER_Y = VB_H / 2;

/* Central Engine */
const ENGINE = { cx: CENTER_X, cy: CENTER_Y, w: 280, h: 180 };

/* Interface nodes positioned around the engine */
const COMMAND_CENTER = { cx: 280, cy: 280, w: 220, h: 120 };
const AI_AGENT = { cx: VB_W - 280, cy: 280, w: 200, h: 120 };
const MOBILE_APP = { cx: 280, cy: VB_H - 220, w: 180, h: 100 };
const CUSTOM_DESK = { cx: VB_W - 280, cy: VB_H - 220, w: 200, h: 100 };

/* Redis Streams at top center */
const REDIS = { cx: CENTER_X, cy: 160, w: 180, h: 80 };

/* Broker at bottom center */
const BROKER = { cx: CENTER_X, cy: VB_H - 140, w: 160, h: 80 };

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */

/* Redis to Engine */
function pathRedisToEngine(): string {
  return `M ${REDIS.cx} ${REDIS.cy + REDIS.h / 2} L ${ENGINE.cx} ${ENGINE.cy - ENGINE.h / 2}`;
}

/* Engine to Broker */
function pathEngineToBroker(): string {
  return `M ${ENGINE.cx} ${ENGINE.cy + ENGINE.h / 2} L ${BROKER.cx} ${BROKER.cy - BROKER.h / 2}`;
}

/* Broker back to Engine (fills) */
function pathBrokerToEngine(): string {
  const x1 = BROKER.cx - 40;
  const y1 = BROKER.cy - BROKER.h / 2;
  const x2 = ENGINE.cx - 40;
  const y2 = ENGINE.cy + ENGINE.h / 2;
  return `M ${x1} ${y1} C ${x1} ${y1 - 30}, ${x2} ${y2 + 30}, ${x2} ${y2}`;
}

/* Command Center to Engine (commands) */
function pathCcToEngine(): string {
  return bezierH(COMMAND_CENTER.cx + COMMAND_CENTER.w / 2, COMMAND_CENTER.cy + 20, ENGINE.cx - ENGINE.w / 2, ENGINE.cy - 30);
}

/* Engine to Command Center (updates) */
function pathEngineToCc(): string {
  return bezierH(ENGINE.cx - ENGINE.w / 2, ENGINE.cy + 30, COMMAND_CENTER.cx + COMMAND_CENTER.w / 2, COMMAND_CENTER.cy + 50);
}

/* AI Agent to Engine (decisions) */
function pathAiToEngine(): string {
  return bezierH(AI_AGENT.cx - AI_AGENT.w / 2, AI_AGENT.cy + 20, ENGINE.cx + ENGINE.w / 2, ENGINE.cy - 30);
}

/* Engine to AI Agent (metrics) */
function pathEngineToAi(): string {
  return bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy + 30, AI_AGENT.cx - AI_AGENT.w / 2, AI_AGENT.cy + 50);
}

/* Mobile App to Engine */
function pathMobileToEngine(): string {
  return bezierH(MOBILE_APP.cx + MOBILE_APP.w / 2, MOBILE_APP.cy - 20, ENGINE.cx - ENGINE.w / 2, ENGINE.cy + 50);
}

/* Engine to Mobile App */
function pathEngineToMobile(): string {
  return bezierH(ENGINE.cx - ENGINE.w / 2, ENGINE.cy + 70, MOBILE_APP.cx + MOBILE_APP.w / 2, MOBILE_APP.cy);
}

/* Custom Desk to Engine */
function pathDeskToEngine(): string {
  return bezierH(CUSTOM_DESK.cx - CUSTOM_DESK.w / 2, CUSTOM_DESK.cy - 20, ENGINE.cx + ENGINE.w / 2, ENGINE.cy + 50);
}

/* Engine to Custom Desk */
function pathEngineToDesk(): string {
  return bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy + 70, CUSTOM_DESK.cx - CUSTOM_DESK.w / 2, CUSTOM_DESK.cy);
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function TradingTerminalSlide({ active }: TradingTerminalSlideProps) {
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

    const allPaths = svg.querySelectorAll<SVGPathElement>(".flow-path, .ret-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    /* Engine first (center focus) */
    const engineNode = svg.querySelector(".engine-node");
    reveal.fromTo(engineNode, { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" }, "-=0.2");

    /* Redis and Broker */
    const coreNodes = svg.querySelectorAll(".core-node");
    reveal.fromTo(coreNodes, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.2");

    /* Interface nodes */
    const interfaceNodes = svg.querySelectorAll(".interface-node");
    reveal.fromTo(interfaceNodes, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }, "-=0.1");

    /* Future badges */
    const futureBadges = svg.querySelectorAll(".future-badge");
    reveal.fromTo(futureBadges, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.1 }, "-=0.2");

    /* Paths draw in */
    reveal.to(allPaths, { opacity: 0.4, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Callouts */
    const callouts = svg.querySelectorAll(".callout");
    reveal.fromTo(callouts, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.3");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Redis → Engine */
    const pRedisEngine = svg.querySelector<SVGPathElement>(".path-redis-engine");
    const dRedisEngine = svg.querySelector<SVGCircleElement>(".dot-redis-engine");
    if (pRedisEngine && dRedisEngine) animateDot(dRedisEngine, pRedisEngine, loop, 0.35, 0);

    /* Engine → Broker */
    const pEngineBroker = svg.querySelector<SVGPathElement>(".path-engine-broker");
    const dEngineBroker = svg.querySelector<SVGCircleElement>(".dot-engine-broker");
    if (pEngineBroker && dEngineBroker) animateDot(dEngineBroker, pEngineBroker, loop, 0.35, 0.3);

    /* Broker → Engine (fills) */
    const pBrokerEngine = svg.querySelector<SVGPathElement>(".path-broker-engine");
    const dBrokerEngine = svg.querySelector<SVGCircleElement>(".dot-broker-engine");
    if (pBrokerEngine && dBrokerEngine) animateDotReverse(dBrokerEngine, pBrokerEngine, loop, 0.3, 0.7);

    /* Command Center → Engine (commands) */
    const pCcEngine = svg.querySelector<SVGPathElement>(".path-cc-engine");
    const dCcEngine = svg.querySelector<SVGCircleElement>(".dot-cc-engine");
    if (pCcEngine && dCcEngine) animateDot(dCcEngine, pCcEngine, loop, 0.4, 0.2);

    /* Engine → Command Center (updates) */
    const pEngineCc = svg.querySelector<SVGPathElement>(".path-engine-cc");
    const dEngineCc = svg.querySelector<SVGCircleElement>(".dot-engine-cc");
    if (pEngineCc && dEngineCc) animateDot(dEngineCc, pEngineCc, loop, 0.4, 0.8);

    /* AI Agent → Engine (decisions) */
    const pAiEngine = svg.querySelector<SVGPathElement>(".path-ai-engine");
    const dAiEngine = svg.querySelector<SVGCircleElement>(".dot-ai-engine");
    if (pAiEngine && dAiEngine) animateDot(dAiEngine, pAiEngine, loop, 0.4, 0.1);

    /* Engine → AI Agent (metrics) */
    const pEngineAi = svg.querySelector<SVGPathElement>(".path-engine-ai");
    const dEngineAi = svg.querySelector<SVGCircleElement>(".dot-engine-ai");
    if (pEngineAi && dEngineAi) animateDot(dEngineAi, pEngineAi, loop, 0.4, 0.6);

    /* Mobile flows (slower, dimmed for "future") */
    const pMobileEngine = svg.querySelector<SVGPathElement>(".path-mobile-engine");
    const dMobileEngine = svg.querySelector<SVGCircleElement>(".dot-mobile-engine");
    if (pMobileEngine && dMobileEngine) animateDot(dMobileEngine, pMobileEngine, loop, 0.5, 0.4);

    const pEngineMobile = svg.querySelector<SVGPathElement>(".path-engine-mobile");
    const dEngineMobile = svg.querySelector<SVGCircleElement>(".dot-engine-mobile");
    if (pEngineMobile && dEngineMobile) animateDot(dEngineMobile, pEngineMobile, loop, 0.5, 1.0);

    /* Custom Desk flows */
    const pDeskEngine = svg.querySelector<SVGPathElement>(".path-desk-engine");
    const dDeskEngine = svg.querySelector<SVGCircleElement>(".dot-desk-engine");
    if (pDeskEngine && dDeskEngine) animateDot(dDeskEngine, pDeskEngine, loop, 0.5, 0.5);

    const pEngineDesk = svg.querySelector<SVGPathElement>(".path-engine-desk");
    const dEngineDesk = svg.querySelector<SVGCircleElement>(".dot-engine-desk");
    if (pEngineDesk && dEngineDesk) animateDot(dEngineDesk, pEngineDesk, loop, 0.5, 1.1);

    /* Pad loop duration */
    loop.to({}, { duration: 0.5 });

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Power Any Trading Interface
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          One engine powers web, mobile, AI, and custom terminals
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

        {/* ═══════════ PATHS ═══════════ */}
        
        {/* Core data flow paths */}
        <path d={pathRedisToEngine()} className="flow-path path-redis-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2.5} />
        <path d={pathEngineToBroker()} className="flow-path path-engine-broker" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathBrokerToEngine()} className="ret-path path-broker-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* Command Center paths */}
        <path d={pathCcToEngine()} className="flow-path path-cc-engine" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathEngineToCc()} className="ret-path path-engine-cc" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* AI Agent paths */}
        <path d={pathAiToEngine()} className="flow-path path-ai-engine" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathEngineToAi()} className="ret-path path-engine-ai" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* Mobile App paths (dimmed for future) */}
        <path d={pathMobileToEngine()} className="flow-path path-mobile-engine" fill="none" stroke="var(--accent-coral)" strokeWidth={1.5} opacity={0.5} />
        <path d={pathEngineToMobile()} className="ret-path path-engine-mobile" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.2} strokeDasharray="6 4" opacity={0.5} />

        {/* Custom Desk paths (dimmed for future) */}
        <path d={pathDeskToEngine()} className="flow-path path-desk-engine" fill="none" stroke="var(--accent-coral)" strokeWidth={1.5} opacity={0.5} />
        <path d={pathEngineToDesk()} className="ret-path path-engine-desk" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.2} strokeDasharray="6 4" opacity={0.5} />

        {/* ═══════════ CENTRAL ENGINE ═══════════ */}
        <g className="engine-node" style={{ opacity: 0 }}>
          {/* Outer glow */}
          <rect
            x={ENGINE.cx - ENGINE.w / 2 - 6}
            y={ENGINE.cy - ENGINE.h / 2 - 6}
            width={ENGINE.w + 12}
            height={ENGINE.h + 12}
            rx={22}
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth={2.5}
            opacity={0.3}
          />
          
          {/* Main box */}
          <rect
            x={ENGINE.cx - ENGINE.w / 2}
            y={ENGINE.cy - ENGINE.h / 2}
            width={ENGINE.w}
            height={ENGINE.h}
            rx={18}
            fill="var(--bg-card)"
            stroke="var(--accent-amber)"
            strokeWidth={2.5}
          />

          <text x={ENGINE.cx} y={ENGINE.cy - 20} textAnchor="middle" className="text-[22px] font-bold" fill="var(--accent-amber)">
            Anekant Engine
          </text>
          <text x={ENGINE.cx} y={ENGINE.cy + 10} textAnchor="middle" className="text-[13px]" fill="var(--text-muted)">
            Event-Driven Core
          </text>
          <text x={ENGINE.cx} y={ENGINE.cy + 30} textAnchor="middle" className="text-[11px]" fill="var(--accent-emerald)">
            Sub-millisecond processing
          </text>
        </g>

        {/* ═══════════ REDIS STREAMS ═══════════ */}
        <g className="core-node" style={{ opacity: 0 }}>
          <rect x={REDIS.cx - REDIS.w / 2} y={REDIS.cy - REDIS.h / 2} width={REDIS.w} height={REDIS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.5} />
          <text x={REDIS.cx} y={REDIS.cy - 8} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Redis Streams</text>
          <text x={REDIS.cx} y={REDIS.cy + 12} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">real-time event bus</text>
        </g>

        {/* ═══════════ BROKER ═══════════ */}
        <g className="core-node" style={{ opacity: 0 }}>
          <rect x={BROKER.cx - BROKER.w / 2} y={BROKER.cy - BROKER.h / 2} width={BROKER.w} height={BROKER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.5} />
          <text x={BROKER.cx} y={BROKER.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Broker</text>
          <text x={BROKER.cx} y={BROKER.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">orders & fills</text>
        </g>

        {/* ═══════════ COMMAND CENTER ═══════════ */}
        <g className="interface-node" style={{ opacity: 0 }}>
          <rect x={COMMAND_CENTER.cx - COMMAND_CENTER.w / 2} y={COMMAND_CENTER.cy - COMMAND_CENTER.h / 2} width={COMMAND_CENTER.w} height={COMMAND_CENTER.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.8} />
          <text x={COMMAND_CENTER.cx} y={COMMAND_CENTER.cy - 25} textAnchor="middle" className="text-[15px] font-bold" fill="var(--text-primary)">Command Center</text>
          <text x={COMMAND_CENTER.cx} y={COMMAND_CENTER.cy - 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Strategy Dashboard</text>
          <text x={COMMAND_CENTER.cx} y={COMMAND_CENTER.cy + 15} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Real-time Controls</text>
          <text x={COMMAND_CENTER.cx} y={COMMAND_CENTER.cy + 35} textAnchor="middle" className="text-[11px]" fill="var(--accent-emerald)">Live Now</text>
        </g>

        {/* ═══════════ AI AGENT ═══════════ */}
        <g className="interface-node" style={{ opacity: 0 }}>
          <rect x={AI_AGENT.cx - AI_AGENT.w / 2} y={AI_AGENT.cy - AI_AGENT.h / 2} width={AI_AGENT.w} height={AI_AGENT.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.8} />
          <text x={AI_AGENT.cx} y={AI_AGENT.cy - 25} textAnchor="middle" className="text-[15px] font-bold" fill="var(--text-primary)">AI Agent</text>
          <text x={AI_AGENT.cx} y={AI_AGENT.cy - 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Autonomous Decisions</text>
          <text x={AI_AGENT.cx} y={AI_AGENT.cy + 15} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">LLM-Powered</text>
          <text x={AI_AGENT.cx} y={AI_AGENT.cy + 35} textAnchor="middle" className="text-[11px]" fill="var(--accent-emerald)">Live Now</text>
        </g>

        {/* ═══════════ MOBILE APP (Future) ═══════════ */}
        <g className="interface-node" style={{ opacity: 0 }}>
          <rect x={MOBILE_APP.cx - MOBILE_APP.w / 2} y={MOBILE_APP.cy - MOBILE_APP.h / 2} width={MOBILE_APP.w} height={MOBILE_APP.h} rx={12} fill="var(--bg-card)" stroke="var(--border-subtle)" strokeWidth={1.2} opacity={0.7} />
          <text x={MOBILE_APP.cx} y={MOBILE_APP.cy - 15} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-muted)">Mobile App</text>
          <text x={MOBILE_APP.cx} y={MOBILE_APP.cy + 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">iOS & Android</text>
          <text x={MOBILE_APP.cx} y={MOBILE_APP.cy + 25} textAnchor="middle" className="text-[10px] font-medium future-badge" fill="var(--accent-amber)" style={{ opacity: 0 }}>Coming Soon</text>
        </g>

        {/* ═══════════ CUSTOM TRADING DESK (Future) ═══════════ */}
        <g className="interface-node" style={{ opacity: 0 }}>
          <rect x={CUSTOM_DESK.cx - CUSTOM_DESK.w / 2} y={CUSTOM_DESK.cy - CUSTOM_DESK.h / 2} width={CUSTOM_DESK.w} height={CUSTOM_DESK.h} rx={12} fill="var(--bg-card)" stroke="var(--border-subtle)" strokeWidth={1.2} opacity={0.7} />
          <text x={CUSTOM_DESK.cx} y={CUSTOM_DESK.cy - 15} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-muted)">Custom Terminal</text>
          <text x={CUSTOM_DESK.cx} y={CUSTOM_DESK.cy + 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Your Trading Desk</text>
          <text x={CUSTOM_DESK.cx} y={CUSTOM_DESK.cy + 25} textAnchor="middle" className="text-[10px] font-medium future-badge" fill="var(--accent-amber)" style={{ opacity: 0 }}>API Ready</text>
        </g>

        {/* ═══════════ CALLOUTS ═══════════ */}
        
        {/* Commands label */}
        <g className="callout" style={{ opacity: 0 }}>
          <rect x={COMMAND_CENTER.cx + COMMAND_CENTER.w / 2 + 15} y={COMMAND_CENTER.cy + 5} width={90} height={24} rx={6} fill="color-mix(in srgb, var(--accent-coral) 20%, var(--bg-card))" stroke="var(--accent-coral)" strokeWidth={0.8} />
          <text x={COMMAND_CENTER.cx + COMMAND_CENTER.w / 2 + 60} y={COMMAND_CENTER.cy + 22} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-coral)">Commands</text>
        </g>

        {/* Updates label */}
        <g className="callout" style={{ opacity: 0 }}>
          <rect x={COMMAND_CENTER.cx + COMMAND_CENTER.w / 2 + 15} y={COMMAND_CENTER.cy + 40} width={90} height={24} rx={6} fill="color-mix(in srgb, var(--accent-emerald) 20%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={0.8} />
          <text x={COMMAND_CENTER.cx + COMMAND_CENTER.w / 2 + 60} y={COMMAND_CENTER.cy + 57} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-emerald)">Updates</text>
        </g>

        {/* Decisions label */}
        <g className="callout" style={{ opacity: 0 }}>
          <rect x={AI_AGENT.cx - AI_AGENT.w / 2 - 105} y={AI_AGENT.cy + 5} width={90} height={24} rx={6} fill="color-mix(in srgb, var(--accent-coral) 20%, var(--bg-card))" stroke="var(--accent-coral)" strokeWidth={0.8} />
          <text x={AI_AGENT.cx - AI_AGENT.w / 2 - 60} y={AI_AGENT.cy + 22} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-coral)">Decisions</text>
        </g>

        {/* Metrics label */}
        <g className="callout" style={{ opacity: 0 }}>
          <rect x={AI_AGENT.cx - AI_AGENT.w / 2 - 105} y={AI_AGENT.cy + 40} width={90} height={24} rx={6} fill="color-mix(in srgb, var(--accent-emerald) 20%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={0.8} />
          <text x={AI_AGENT.cx - AI_AGENT.w / 2 - 60} y={AI_AGENT.cy + 57} textAnchor="middle" className="text-[10px] font-semibold" fill="var(--accent-emerald)">Metrics</text>
        </g>

        {/* Key message badge */}
        <g className="callout" style={{ opacity: 0 }}>
          <rect x={CENTER_X - 200} y={VB_H - 60} width={400} height={45} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={CENTER_X} y={VB_H - 32} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">One Engine, Unlimited Interfaces</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        <circle className="dot-redis-engine" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-engine-broker" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-broker-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        
        <circle className="dot-cc-engine" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-engine-cc" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        
        <circle className="dot-ai-engine" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-engine-ai" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        
        <circle className="dot-mobile-engine" r={4} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-engine-mobile" r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        
        <circle className="dot-desk-engine" r={4} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-engine-desk" r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
      </svg>
    </SlideLayout>
  );
}
