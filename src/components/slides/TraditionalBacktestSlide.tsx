import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";

/* ================================================================
 *  TraditionalBacktestSlide - Problems with Traditional Backtesting
 *
 *  Full-screen diagram showing the broken traditional workflow:
 *  - Jupyter notebook for backtesting (pandas, minute bars)
 *  - Separate live trading system (different code)
 *  - Disconnect between backtest and production results
 * ================================================================ */

interface TraditionalBacktestSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_X = VB_W / 2;
const LEFT_X = CENTER_X - 280;
const RIGHT_X = CENTER_X + 280;

/* Backtest side */
const JUPYTER = { cx: LEFT_X, cy: 280, w: 240, h: 120 };
const BT_DETAILS = { cx: LEFT_X, cy: 480, w: 220, h: 140 };

/* Live side */
const LIVE_SYSTEM = { cx: RIGHT_X, cy: 280, w: 240, h: 120 };
const LIVE_DETAILS = { cx: RIGHT_X, cy: 480, w: 220, h: 140 };

/* Center disconnect */
const DISCONNECT_Y = 380;

/* Problems box */
const PROBLEMS = { cx: CENTER_X, cy: 750, w: 700, h: 150 };

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathJupyterToDetails(): string {
  return `M ${JUPYTER.cx} ${JUPYTER.cy + JUPYTER.h / 2} L ${BT_DETAILS.cx} ${BT_DETAILS.cy - BT_DETAILS.h / 2}`;
}

function pathLiveToDetails(): string {
  return `M ${LIVE_SYSTEM.cx} ${LIVE_SYSTEM.cy + LIVE_SYSTEM.h / 2} L ${LIVE_DETAILS.cx} ${LIVE_DETAILS.cy - LIVE_DETAILS.h / 2}`;
}

function pathJupyterToLive(): string {
  return `M ${JUPYTER.cx + JUPYTER.w / 2} ${JUPYTER.cy} L ${LIVE_SYSTEM.cx - LIVE_SYSTEM.w / 2} ${LIVE_SYSTEM.cy}`;
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function TraditionalBacktestSlide({ active }: TraditionalBacktestSlideProps) {
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

    const allPaths = svg.querySelectorAll<SVGPathElement>(".flow-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    const headers = svg.querySelectorAll(".col-header");
    reveal.fromTo(headers, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: "power2.out" }, "-=0.2");

    const leftNodes = svg.querySelectorAll(".left-node");
    reveal.fromTo(leftNodes, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.1");

    const rightNodes = svg.querySelectorAll(".right-node");
    reveal.fromTo(rightNodes, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.3");

    reveal.to(allPaths, { opacity: 0.4, strokeDashoffset: 0, duration: 0.5, stagger: 0.05, ease: "power1.inOut" });

    const disconnect = svg.querySelector(".disconnect-box");
    reveal.fromTo(disconnect, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out" }, "-=0.2");

    const problems = svg.querySelector(".problems-box");
    reveal.fromTo(problems, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.1");

    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Animate attempt to port code (fails) */
    const portDot = svg.querySelector<SVGCircleElement>(".port-dot");
    const portPath = svg.querySelector<SVGPathElement>(".path-port");
    
    if (portDot && portPath) {
      const len = portPath.getTotalLength();
      
      loop.fromTo(portDot, { opacity: 0 }, { opacity: 0.9, duration: 0.2 }, 0);
      
      loop.to(portDot, {
        duration: 1.2,
        ease: "power1.inOut",
        onUpdate() {
          const progress = this.progress();
          const pt = portPath.getPointAtLength(progress * len);
          gsap.set(portDot, { attr: { cx: pt.x, cy: pt.y } });
        },
      }, 0.2);

      /* Question mark pulse */
      const questionMark = svg.querySelector(".question-mark");
      if (questionMark) {
        loop.to(questionMark, { scale: 1.3, transformOrigin: "center center", duration: 0.2 }, 0.8);
        loop.to(questionMark, { scale: 1, duration: 0.2 }, 1.0);
      }

      /* Fail animation */
      const failMark = svg.querySelector(".fail-mark");
      if (failMark) {
        loop.fromTo(failMark, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out" }, 1.4);
        loop.to(failMark, { opacity: 0, duration: 0.3 }, 2.5);
      }
      
      loop.to(portDot, { opacity: 0, duration: 0.3 }, 1.5);
    }

    /* Pulse the disconnect symbol */
    const disconnectSymbol = svg.querySelector(".disconnect-symbol");
    if (disconnectSymbol) {
      loop.to(disconnectSymbol, { scale: 1.1, transformOrigin: "center center", duration: 0.3 }, 1.6);
      loop.to(disconnectSymbol, { scale: 1, duration: 0.3 }, 1.9);
    }

    loop.to({}, { duration: 0.5 });

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-5">
      <div ref={titleRef} className="mb-2 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          The Backtesting Problem
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Why Jupyter notebooks don't match production
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxWidth: "1560px", maxHeight: "calc(100vh - 120px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs><StandardDefs /></defs>
        <rect width={VB_W} height={VB_H} fill="url(#dotgrid)" />

        {/* ═══════════ COLUMN HEADERS ═══════════ */}
        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={LEFT_X - 130} y={120} width={260} height={40} rx={8} fill="color-mix(in srgb, var(--accent-red) 15%, transparent)" stroke="var(--accent-red)" strokeWidth={1} />
          <text x={LEFT_X} y={147} textAnchor="middle" className="text-[15px] font-bold uppercase tracking-wide" fill="var(--accent-red)">Backtesting</text>
        </g>

        <g className="col-header" style={{ opacity: 0 }}>
          <rect x={RIGHT_X - 130} y={120} width={260} height={40} rx={8} fill="color-mix(in srgb, var(--accent-red) 15%, transparent)" stroke="var(--accent-red)" strokeWidth={1} />
          <text x={RIGHT_X} y={147} textAnchor="middle" className="text-[15px] font-bold uppercase tracking-wide" fill="var(--accent-red)">Live Trading</text>
        </g>

        {/* ═══════════ LEFT SIDE - BACKTESTING ═══════════ */}
        
        {/* Jupyter Notebook */}
        <g className="left-node" style={{ opacity: 0 }}>
          <rect x={JUPYTER.cx - JUPYTER.w / 2} y={JUPYTER.cy - JUPYTER.h / 2} width={JUPYTER.w} height={JUPYTER.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.6} />
          <text x={JUPYTER.cx} y={JUPYTER.cy - 30} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-red)">Jupyter Notebook</text>
          <text x={JUPYTER.cx} y={JUPYTER.cy - 6} textAnchor="middle" className="text-[13px]" fill="var(--text-muted)">pandas, numpy, matplotlib</text>
          <text x={JUPYTER.cx} y={JUPYTER.cy + 16} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">quick & dirty backtesting</text>
          <text x={JUPYTER.cx} y={JUPYTER.cy + 40} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">minute-bar data only</text>
        </g>

        {/* Backtest Details */}
        <g className="left-node" style={{ opacity: 0 }}>
          <rect x={BT_DETAILS.cx - BT_DETAILS.w / 2} y={BT_DETAILS.cy - BT_DETAILS.h / 2} width={BT_DETAILS.w} height={BT_DETAILS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} strokeDasharray="6 4" />
          <text x={BT_DETAILS.cx} y={BT_DETAILS.cy - 45} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-red)">Backtest Environment</text>
          <text x={BT_DETAILS.cx - 95} y={BT_DETAILS.cy - 20} className="text-[11px]" fill="var(--text-muted)">• Different libraries</text>
          <text x={BT_DETAILS.cx - 95} y={BT_DETAILS.cy} className="text-[11px]" fill="var(--text-muted)">• No real tick data</text>
          <text x={BT_DETAILS.cx - 95} y={BT_DETAILS.cy + 20} className="text-[11px]" fill="var(--text-muted)">• Simplified indicators</text>
          <text x={BT_DETAILS.cx - 95} y={BT_DETAILS.cy + 40} className="text-[11px]" fill="var(--text-muted)">• No slippage modeling</text>
        </g>

        {/* ═══════════ RIGHT SIDE - LIVE TRADING ═══════════ */}
        
        {/* Live System */}
        <g className="right-node" style={{ opacity: 0 }}>
          <rect x={LIVE_SYSTEM.cx - LIVE_SYSTEM.w / 2} y={LIVE_SYSTEM.cy - LIVE_SYSTEM.h / 2} width={LIVE_SYSTEM.w} height={LIVE_SYSTEM.h} rx={14} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.6} />
          <text x={LIVE_SYSTEM.cx} y={LIVE_SYSTEM.cy - 30} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-red)">Live Trading System</text>
          <text x={LIVE_SYSTEM.cx} y={LIVE_SYSTEM.cy - 6} textAnchor="middle" className="text-[13px]" fill="var(--text-muted)">production code</text>
          <text x={LIVE_SYSTEM.cx} y={LIVE_SYSTEM.cy + 16} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">completely different codebase</text>
          <text x={LIVE_SYSTEM.cx} y={LIVE_SYSTEM.cy + 40} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-red)">real tick data</text>
        </g>

        {/* Live Details */}
        <g className="right-node" style={{ opacity: 0 }}>
          <rect x={LIVE_DETAILS.cx - LIVE_DETAILS.w / 2} y={LIVE_DETAILS.cy - LIVE_DETAILS.h / 2} width={LIVE_DETAILS.w} height={LIVE_DETAILS.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-red)" strokeWidth={1.2} strokeDasharray="6 4" />
          <text x={LIVE_DETAILS.cx} y={LIVE_DETAILS.cy - 45} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-red)">Production Environment</text>
          <text x={LIVE_DETAILS.cx - 95} y={LIVE_DETAILS.cy - 20} className="text-[11px]" fill="var(--text-muted)">• Production libraries</text>
          <text x={LIVE_DETAILS.cx - 95} y={LIVE_DETAILS.cy} className="text-[11px]" fill="var(--text-muted)">• Real tick stream</text>
          <text x={LIVE_DETAILS.cx - 95} y={LIVE_DETAILS.cy + 20} className="text-[11px]" fill="var(--text-muted)">• Full indicator suite</text>
          <text x={LIVE_DETAILS.cx - 95} y={LIVE_DETAILS.cy + 40} className="text-[11px]" fill="var(--text-muted)">• Real slippage</text>
        </g>

        {/* ═══════════ PATHS ═══════════ */}
        <path d={pathJupyterToDetails()} className="flow-path" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={pathLiveToDetails()} className="flow-path" fill="none" stroke="var(--accent-red)" strokeWidth={2} />
        <path d={pathJupyterToLive()} className="flow-path path-port" fill="none" stroke="var(--accent-red)" strokeWidth={2.5} strokeDasharray="8 6" />

        {/* Question mark on port path */}
        <g className="question-mark" style={{ opacity: 1 }}>
          <circle cx={CENTER_X} cy={JUPYTER.cy - 40} r={20} fill="color-mix(in srgb, var(--accent-red) 20%, var(--bg-card))" stroke="var(--accent-red)" strokeWidth={1.5} />
          <text x={CENTER_X} y={JUPYTER.cy - 33} textAnchor="middle" className="text-[20px] font-bold" fill="var(--accent-red)">?</text>
        </g>
        <text x={CENTER_X} y={JUPYTER.cy - 70} textAnchor="middle" className="left-node text-[12px] font-medium" fill="var(--accent-red)" style={{ opacity: 0 }}>Port code?</text>

        {/* ═══════════ CENTER DISCONNECT ═══════════ */}
        <g className="disconnect-box" style={{ opacity: 0 }}>
          <rect x={CENTER_X - 140} y={DISCONNECT_Y - 35} width={280} height={70} rx={12} fill="color-mix(in srgb, var(--accent-red) 15%, var(--bg-card))" stroke="var(--accent-red)" strokeWidth={2} />
          <g className="disconnect-symbol">
            <text x={CENTER_X} y={DISCONNECT_Y - 5} textAnchor="middle" className="text-[24px] font-bold" fill="var(--accent-red)">≠</text>
          </g>
          <text x={CENTER_X} y={DISCONNECT_Y + 22} textAnchor="middle" className="text-[13px] font-semibold" fill="var(--accent-red)">Results Don't Match</text>
        </g>

        {/* Fail mark (appears during animation) */}
        <g className="fail-mark" style={{ opacity: 0 }} transform={`translate(${CENTER_X + 60}, ${JUPYTER.cy})`}>
          <circle r={24} fill="var(--accent-red)" opacity={0.3} />
          <text textAnchor="middle" y={8} className="text-[26px] font-bold" fill="var(--accent-red)">✗</text>
        </g>

        {/* ═══════════ PROBLEMS BOX ═══════════ */}
        <g className="problems-box" style={{ opacity: 0 }}>
          <rect x={PROBLEMS.cx - PROBLEMS.w / 2} y={PROBLEMS.cy - PROBLEMS.h / 2} width={PROBLEMS.w} height={PROBLEMS.h} rx={14} fill="color-mix(in srgb, var(--accent-red) 12%, var(--bg-card))" stroke="var(--accent-red)" strokeWidth={1.5} />
          <text x={PROBLEMS.cx} y={PROBLEMS.cy - 50} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-red)">Problems with Traditional Approach</text>
          
          <text x={PROBLEMS.cx - 320} y={PROBLEMS.cy - 15} className="text-[13px]" fill="var(--text-muted)">• Minute-bar granularity only</text>
          <text x={PROBLEMS.cx - 320} y={PROBLEMS.cy + 10} className="text-[13px]" fill="var(--text-muted)">• No tick-by-tick or 1-second replay</text>
          
          <text x={PROBLEMS.cx + 20} y={PROBLEMS.cy - 15} className="text-[13px]" fill="var(--text-muted)">• Must rewrite code for production</text>
          <text x={PROBLEMS.cx + 20} y={PROBLEMS.cy + 10} className="text-[13px]" fill="var(--text-muted)">• Different indicators, different behavior</text>
          
          <text x={PROBLEMS.cx} y={PROBLEMS.cy + 45} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-red)">Backtest results ≠ Live trading results</text>
        </g>

        {/* Port dot */}
        <circle className="port-dot" cx={JUPYTER.cx + JUPYTER.w / 2} cy={JUPYTER.cy} r={7} fill="var(--accent-red)" opacity={0} filter="url(#glowRed)" />
      </svg>
    </SlideLayout>
  );
}
