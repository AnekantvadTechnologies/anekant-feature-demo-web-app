import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, ENGINE_ITEMS, bezierH, itemY, ITEM_W, ITEM_H } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  CodeReuseSlide - "One Codebase, Two Modes"
 *
 *  Side-by-side comparison showing the SAME engine code running in:
 *    Left: Live Trading mode
 *    Right: Backtesting mode (with granularity options)
 *
 *  Key message: Same engine, same strategy, same indicators for both.
 * ================================================================ */

interface CodeReuseSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_X = VB_W / 2;

/* Shared engine in center */
const ENGINE_W = 300;
const ENGINE_H = 280;
const ENGINE = { cx: CENTER_X, cy: 480, w: ENGINE_W, h: ENGINE_H };

/* Left side - Live Trading */
const LIVE_EXCHANGE = { cx: 170, cy: 280, w: 140, h: 70 };
const LIVE_REDIS = { cx: 170, cy: 420, w: 130, h: 80 };
const LIVE_BROKER = { cx: 170, cy: 640, w: 130, h: 70 };

/* Right side - Backtesting */
const BT_S3 = { cx: VB_W - 170, cy: 280, w: 140, h: 70 };
const BT_DISPATCHER = { cx: VB_W - 170, cy: 420, w: 150, h: 80 };
const BT_REPLAY_OMS = { cx: VB_W - 170, cy: 640, w: 140, h: 70 };

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathLiveExchangeToRedis(): string {
  return `M ${LIVE_EXCHANGE.cx} ${LIVE_EXCHANGE.cy + LIVE_EXCHANGE.h / 2} L ${LIVE_REDIS.cx} ${LIVE_REDIS.cy - LIVE_REDIS.h / 2}`;
}

function pathLiveRedisToEngine(): string {
  return bezierH(LIVE_REDIS.cx + LIVE_REDIS.w / 2, LIVE_REDIS.cy, ENGINE.cx - ENGINE.w / 2, ENGINE.cy - 50);
}

function pathLiveEngineToBroker(): string {
  return bezierH(ENGINE.cx - ENGINE.w / 2, ENGINE.cy + 50, LIVE_BROKER.cx + LIVE_BROKER.w / 2, LIVE_BROKER.cy);
}

function pathLiveBrokerToEngine(): string {
  const x1 = LIVE_BROKER.cx + LIVE_BROKER.w / 2;
  const y1 = LIVE_BROKER.cy - 20;
  const x2 = ENGINE.cx - ENGINE.w / 2;
  const y2 = ENGINE.cy + 90;
  return `M ${x1} ${y1} C ${x1 + 50} ${y1 - 30}, ${x2 - 30} ${y2}, ${x2} ${y2}`;
}

function pathBtS3ToDispatcher(): string {
  return `M ${BT_S3.cx} ${BT_S3.cy + BT_S3.h / 2} L ${BT_DISPATCHER.cx} ${BT_DISPATCHER.cy - BT_DISPATCHER.h / 2}`;
}

function pathBtDispatcherToEngine(): string {
  return bezierH(BT_DISPATCHER.cx - BT_DISPATCHER.w / 2, BT_DISPATCHER.cy, ENGINE.cx + ENGINE.w / 2, ENGINE.cy - 50);
}

function pathBtEngineToOms(): string {
  return bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy + 50, BT_REPLAY_OMS.cx - BT_REPLAY_OMS.w / 2, BT_REPLAY_OMS.cy);
}

function pathBtOmsToEngine(): string {
  const x1 = BT_REPLAY_OMS.cx - BT_REPLAY_OMS.w / 2;
  const y1 = BT_REPLAY_OMS.cy - 20;
  const x2 = ENGINE.cx + ENGINE.w / 2;
  const y2 = ENGINE.cy + 90;
  return `M ${x1} ${y1} C ${x1 - 50} ${y1 - 30}, ${x2 + 30} ${y2}, ${x2} ${y2}`;
}

/* ================================================================
 *  Central Engine Box Component
 * ================================================================ */
function CentralEngineBox() {
  return (
    <g className="engine-node" style={{ opacity: 0 }}>
      {/* Outer glow */}
      <rect
        x={ENGINE.cx - ENGINE.w / 2 - 4}
        y={ENGINE.cy - ENGINE.h / 2 - 4}
        width={ENGINE.w + 8}
        height={ENGINE.h + 8}
        rx={20}
        fill="none"
        stroke="var(--accent-amber)"
        strokeWidth={2}
        opacity={0.3}
      />
      
      {/* Main box */}
      <rect
        x={ENGINE.cx - ENGINE.w / 2}
        y={ENGINE.cy - ENGINE.h / 2}
        width={ENGINE.w}
        height={ENGINE.h}
        rx={17}
        fill="var(--bg-card)"
        stroke="var(--accent-amber)"
        strokeWidth={2}
      />

      {/* Engine label */}
      <text x={ENGINE.cx} y={ENGINE.cy - ENGINE.h / 2 + 28} textAnchor="middle" className="text-[17px] font-bold" fill="var(--accent-amber)">
        Anekant Engine
      </text>

      {/* Internal items */}
      {ENGINE_ITEMS.map((item, i) => {
        const iy = itemY(ENGINE.cy, ENGINE.h, i) + 10;
        return (
          <g key={`item-${i}`} className="engine-item" style={{ opacity: 0 }}>
            <rect
              x={ENGINE.cx - ITEM_W / 2}
              y={iy - ITEM_H / 2}
              width={ITEM_W}
              height={ITEM_H}
              rx={7}
              fill="var(--bg-secondary)"
              stroke="var(--accent-emerald)"
              strokeWidth={1}
              opacity={0.8}
            />
            <text x={ENGINE.cx} y={iy + 5} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-emerald)">
              {item}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function CodeReuseSlide({ active }: CodeReuseSlideProps) {
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

    const reveal = gsap.timeline();
    revealTlRef.current = reveal;

    const allPaths = svg.querySelectorAll<SVGPathElement>(".flow-path, .ret-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    const headers = svg.querySelectorAll(".col-header");
    reveal.fromTo(headers, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.2");

    const engineNode = svg.querySelector(".engine-node");
    reveal.fromTo(engineNode, { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" }, "-=0.1");

    const badges = svg.querySelectorAll(".same-code-badge");
    reveal.fromTo(badges, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out" }, "-=0.2");

    const items = svg.querySelectorAll(".engine-item");
    reveal.fromTo(items, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: "power2.out" }, "-=0.2");

    const sideNodes = svg.querySelectorAll(".side-node");
    reveal.fromTo(sideNodes, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }, "-=0.2");

    reveal.to(allPaths, { opacity: 0.4, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    const granularityBadges = svg.querySelectorAll(".granularity-badge");
    reveal.fromTo(granularityBadges, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.2");

    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.3, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* ═══ LIVE SIDE (left) ═══ */
    const liveP1 = svg.querySelector<SVGPathElement>(".path-live-ex-redis");
    const liveD1 = svg.querySelector<SVGCircleElement>(".dot-live-ex-redis");
    if (liveP1 && liveD1) animateDot(liveD1, liveP1, loop, 0.3, 0);

    const liveP2 = svg.querySelector<SVGPathElement>(".path-live-redis-engine");
    const liveD2 = svg.querySelector<SVGCircleElement>(".dot-live-redis-engine");
    if (liveP2 && liveD2) animateDot(liveD2, liveP2, loop, 0.35, 0.2);

    const liveP3 = svg.querySelector<SVGPathElement>(".path-live-engine-broker");
    const liveD3 = svg.querySelector<SVGCircleElement>(".dot-live-engine-broker");
    if (liveP3 && liveD3) animateDot(liveD3, liveP3, loop, 0.35, 0.6);

    const liveP4 = svg.querySelector<SVGPathElement>(".path-live-broker-engine");
    const liveD4 = svg.querySelector<SVGCircleElement>(".dot-live-broker-engine");
    if (liveP4 && liveD4) animateDotReverse(liveD4, liveP4, loop, 0.3, 1.0);

    /* ═══ BACKTEST SIDE (right) ═══ */
    const btP1 = svg.querySelector<SVGPathElement>(".path-bt-s3-disp");
    const btD1 = svg.querySelector<SVGCircleElement>(".dot-bt-s3-disp");
    if (btP1 && btD1) animateDot(btD1, btP1, loop, 0.25, 0);

    const btP2 = svg.querySelector<SVGPathElement>(".path-bt-disp-engine");
    const btD2 = svg.querySelector<SVGCircleElement>(".dot-bt-disp-engine");
    if (btP2 && btD2) animateDot(btD2, btP2, loop, 0.3, 0.15);

    const btP3 = svg.querySelector<SVGPathElement>(".path-bt-engine-oms");
    const btD3 = svg.querySelector<SVGCircleElement>(".dot-bt-engine-oms");
    if (btP3 && btD3) animateDot(btD3, btP3, loop, 0.3, 0.5);

    const btP4 = svg.querySelector<SVGPathElement>(".path-bt-oms-engine");
    const btD4 = svg.querySelector<SVGCircleElement>(".dot-bt-oms-engine");
    if (btP4 && btD4) animateDotReverse(btD4, btP4, loop, 0.25, 0.85);

    /* Pulse the "Same Code" badges */
    const sameCodeBadges = svg.querySelectorAll(".same-code-badge rect");
    loop.to(sameCodeBadges, { strokeWidth: 2.5, duration: 0.3, ease: "power2.out" }, 0.4);
    loop.to(sameCodeBadges, { strokeWidth: 1.2, duration: 0.3, ease: "power2.in" }, 0.7);

    loop.to({}, { duration: 0.8 });

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-2 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          One Engine, Live & Backtest
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Same engine, same strategy, same indicators
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1560px", maxHeight: "calc(100vh - 130px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs><StandardDefs /></defs>
        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ COLUMN HEADERS ═══════════ */}
        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={50} y={130} width={240} height={40} rx={8} fill="color-mix(in srgb, var(--accent-amber) 15%, transparent)" stroke="var(--accent-amber)" strokeWidth={1} />
          <text x={170} y={157} textAnchor="middle" className="text-[15px] font-bold uppercase tracking-wide" fill="var(--accent-amber)">Live Trading</text>
        </g>

        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={VB_W - 290} y={130} width={240} height={40} rx={8} fill="color-mix(in srgb, var(--accent-coral) 15%, transparent)" stroke="var(--accent-coral)" strokeWidth={1} />
          <text x={VB_W - 170} y={157} textAnchor="middle" className="text-[15px] font-bold uppercase tracking-wide" fill="var(--accent-coral)">Backtesting</text>
        </g>

        {/* ═══════════ PATHS ═══════════ */}
        
        {/* Live side paths */}
        <path d={pathLiveExchangeToRedis()} className="flow-path path-live-ex-redis" fill="none" stroke="var(--accent-amber)" strokeWidth={2} />
        <path d={pathLiveRedisToEngine()} className="flow-path path-live-redis-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2} />
        <path d={pathLiveEngineToBroker()} className="flow-path path-live-engine-broker" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathLiveBrokerToEngine()} className="ret-path path-live-broker-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* Backtest side paths */}
        <path d={pathBtS3ToDispatcher()} className="flow-path path-bt-s3-disp" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathBtDispatcherToEngine()} className="flow-path path-bt-disp-engine" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        <path d={pathBtEngineToOms()} className="flow-path path-bt-engine-oms" fill="none" stroke="var(--accent-amber)" strokeWidth={2} />
        <path d={pathBtOmsToEngine()} className="ret-path path-bt-oms-engine" fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* ═══════════ CENTRAL ENGINE ═══════════ */}
        <CentralEngineBox />

        {/* ═══════════ SAME CODE BADGES ═══════════ */}
        <g className="same-code-badge" style={{ opacity: 0 }}>
          <rect x={ENGINE.cx - 85} y={ENGINE.cy - ENGINE.h / 2 - 50} width={170} height={32} rx={8} fill="color-mix(in srgb, var(--accent-emerald) 20%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.2} />
          <text x={ENGINE.cx} y={ENGINE.cy - ENGINE.h / 2 - 28} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-emerald)">Same Engine Code</text>
        </g>

        <g className="same-code-badge" style={{ opacity: 0 }}>
          <rect x={ENGINE.cx - 90} y={ENGINE.cy + ENGINE.h / 2 + 15} width={180} height={32} rx={8} fill="color-mix(in srgb, var(--accent-emerald) 20%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.2} />
          <text x={ENGINE.cx} y={ENGINE.cy + ENGINE.h / 2 + 37} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-emerald)">Same Strategy Code</text>
        </g>

        {/* ═══════════ LEFT SIDE NODES (Live) ═══════════ */}
        
        {/* Exchange */}
        <g className="side-node" style={{ opacity: 0 }}>
          <rect x={LIVE_EXCHANGE.cx - LIVE_EXCHANGE.w / 2} y={LIVE_EXCHANGE.cy - LIVE_EXCHANGE.h / 2} width={LIVE_EXCHANGE.w} height={LIVE_EXCHANGE.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={LIVE_EXCHANGE.cx} y={LIVE_EXCHANGE.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Exchange</text>
          <text x={LIVE_EXCHANGE.cx} y={LIVE_EXCHANGE.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">live ticks</text>
        </g>

        {/* Redis */}
        <g className="side-node" style={{ opacity: 0 }}>
          <rect x={LIVE_REDIS.cx - LIVE_REDIS.w / 2} y={LIVE_REDIS.cy - LIVE_REDIS.h / 2} width={LIVE_REDIS.w} height={LIVE_REDIS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.4} />
          <text x={LIVE_REDIS.cx} y={LIVE_REDIS.cy - 8} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Redis</text>
          <text x={LIVE_REDIS.cx} y={LIVE_REDIS.cy + 10} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Streams</text>
          <text x={LIVE_REDIS.cx} y={LIVE_REDIS.cy + 28} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">real-time</text>
        </g>

        {/* Broker */}
        <g className="side-node" style={{ opacity: 0 }}>
          <rect x={LIVE_BROKER.cx - LIVE_BROKER.w / 2} y={LIVE_BROKER.cy - LIVE_BROKER.h / 2} width={LIVE_BROKER.w} height={LIVE_BROKER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={LIVE_BROKER.cx} y={LIVE_BROKER.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Broker</text>
          <text x={LIVE_BROKER.cx} y={LIVE_BROKER.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">real orders</text>
        </g>

        {/* Fills label */}
        <text x={LIVE_BROKER.cx} y={LIVE_BROKER.cy + LIVE_BROKER.h / 2 + 20} textAnchor="middle" className="side-node text-[10px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0 }}>fills</text>

        {/* ═══════════ RIGHT SIDE NODES (Backtest) ═══════════ */}
        
        {/* S3 */}
        <g className="side-node" style={{ opacity: 0 }}>
          <rect x={BT_S3.cx - BT_S3.w / 2} y={BT_S3.cy - BT_S3.h / 2} width={BT_S3.w} height={BT_S3.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={BT_S3.cx} y={BT_S3.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">S3</text>
          <text x={BT_S3.cx} y={BT_S3.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">historical data</text>
        </g>

        {/* Backtesting Dispatcher */}
        <g className="side-node" style={{ opacity: 0 }}>
          <rect x={BT_DISPATCHER.cx - BT_DISPATCHER.w / 2} y={BT_DISPATCHER.cy - BT_DISPATCHER.h / 2} width={BT_DISPATCHER.w} height={BT_DISPATCHER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.4} />
          <text x={BT_DISPATCHER.cx} y={BT_DISPATCHER.cy - 8} textAnchor="middle" className="text-[12px] font-bold" fill="var(--text-primary)">Backtesting</text>
          <text x={BT_DISPATCHER.cx} y={BT_DISPATCHER.cy + 10} textAnchor="middle" className="text-[12px] font-bold" fill="var(--text-primary)">Dispatcher</text>
          <text x={BT_DISPATCHER.cx} y={BT_DISPATCHER.cy + 28} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">simulated time</text>
        </g>

        {/* Replay OMS */}
        <g className="side-node" style={{ opacity: 0 }}>
          <rect x={BT_REPLAY_OMS.cx - BT_REPLAY_OMS.w / 2} y={BT_REPLAY_OMS.cy - BT_REPLAY_OMS.h / 2} width={BT_REPLAY_OMS.w} height={BT_REPLAY_OMS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.4} />
          <text x={BT_REPLAY_OMS.cx} y={BT_REPLAY_OMS.cy - 5} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">Replay OMS</text>
          <text x={BT_REPLAY_OMS.cx} y={BT_REPLAY_OMS.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">simulated fills</text>
        </g>

        {/* Fills label */}
        <text x={BT_REPLAY_OMS.cx} y={BT_REPLAY_OMS.cy + BT_REPLAY_OMS.h / 2 + 20} textAnchor="middle" className="side-node text-[10px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0 }}>simulated fills</text>

        {/* ═══════════ GRANULARITY MODE BADGES ═══════════ */}
        <g className="granularity-badge" style={{ opacity: 0 }}>
          <rect x={VB_W - 300} y={520} width={260} height={75} rx={10} fill="color-mix(in srgb, var(--accent-coral) 12%, var(--bg-card))" stroke="var(--accent-coral)" strokeWidth={1} />
          <text x={VB_W - 170} y={545} textAnchor="middle" className="text-[12px] font-bold" fill="var(--accent-coral)">Granularity Options</text>
          <text x={VB_W - 285} y={568} className="text-[11px]" fill="var(--text-muted)">• Fast: 1-min bars (~100x speed)</text>
          <text x={VB_W - 285} y={586} className="text-[11px]" fill="var(--text-muted)">• Accurate: tick-by-tick replay</text>
        </g>

        {/* ═══════════ BOTTOM BENEFITS ═══════════ */}
        <g className="same-code-badge" style={{ opacity: 0 }}>
          <rect x={CENTER_X - 220} y={800} width={440} height={55} rx={10} fill="color-mix(in srgb, var(--accent-emerald) 15%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.2} />
          <text x={CENTER_X} y={825} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-emerald)">Backtest results = Production behavior</text>
          <text x={CENTER_X} y={845} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Same indicators • Same async I/O • No code divergence</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        
        {/* Live side dots */}
        <circle className="dot-live-ex-redis" r={5} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-live-redis-engine" r={5} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-live-engine-broker" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-live-broker-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />

        {/* Backtest side dots */}
        <circle className="dot-bt-s3-disp" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-bt-disp-engine" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-bt-engine-oms" r={5} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-bt-oms-engine" r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
      </svg>
    </SlideLayout>
  );
}
