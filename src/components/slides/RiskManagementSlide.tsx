import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot } from "./shared/animate-dot";

/* ================================================================
 *  RiskManagementSlide - "Institutional-Grade Risk Controls"
 *
 *  Shows centralized risk management with:
 *    - Top: Multiple strategies generating orders
 *    - Center: Position Manager with live Greeks
 *    - Bottom: Risk controls (Stop Loss, Margin Limits, Position Limits)
 *
 *  Demonstrates portfolio-level risk management.
 * ================================================================ */

interface RiskManagementSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_X = VB_W / 2;

/* Strategies at top */
const STRATEGIES = [
  { cx: 280, cy: 200, w: 180, h: 90, label: "Strangle Strategy", color: "var(--accent-amber)" },
  { cx: CENTER_X, cy: 200, w: 180, h: 90, label: "Momentum Strategy", color: "var(--accent-coral)" },
  { cx: VB_W - 280, cy: 200, w: 180, h: 90, label: "AI Strategy", color: "var(--accent-emerald)" },
];

/* Position Manager (center) */
const POSITION_MGR = { cx: CENTER_X, cy: 450, w: 500, h: 220 };

/* Risk Controls at bottom */
const RISK_CONTROLS = [
  { cx: 300, cy: 750, w: 200, h: 90, label: "Stop Loss", value: "-2% MTM", icon: "🛑" },
  { cx: CENTER_X, cy: 750, w: 200, h: 90, label: "Margin Limits", value: "80% max", icon: "📊" },
  { cx: VB_W - 300, cy: 750, w: 200, h: 90, label: "Position Limits", value: "500 lots", icon: "⚖️" },
];

/* Greeks display positions */
const GREEKS = [
  { label: "Delta", value: "-0.23", color: "var(--accent-amber)" },
  { label: "Theta", value: "+₹2,450", color: "var(--accent-emerald)" },
  { label: "Vega", value: "-₹890", color: "var(--accent-coral)" },
  { label: "P&L", value: "+₹45,200", color: "var(--accent-emerald)" },
];

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathStrategyToMgr(strategy: typeof STRATEGIES[0]): string {
  return bezierH(strategy.cx, strategy.cy + strategy.h / 2, POSITION_MGR.cx - 100 + STRATEGIES.indexOf(strategy) * 100, POSITION_MGR.cy - POSITION_MGR.h / 2);
}

function pathMgrToControl(control: typeof RISK_CONTROLS[0]): string {
  return bezierH(POSITION_MGR.cx - 150 + RISK_CONTROLS.indexOf(control) * 150, POSITION_MGR.cy + POSITION_MGR.h / 2, control.cx, control.cy - control.h / 2);
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function RiskManagementSlide({ active }: RiskManagementSlideProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const loopTlRef = useRef<gsap.core.Timeline | null>(null);
  const greekRefs = useRef<{ [key: string]: number }>({
    delta: -0.23,
    theta: 2450,
    vega: -890,
    pnl: 45200,
  });

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

    /* Strategies */
    const strategyNodes = svg.querySelectorAll(".strategy-node");
    reveal.fromTo(strategyNodes, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.2");

    /* Position Manager */
    const mgrNode = svg.querySelector(".mgr-node");
    reveal.fromTo(mgrNode, { opacity: 0, scale: 0.95, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" }, "-=0.1");

    /* Greeks */
    const greekBoxes = svg.querySelectorAll(".greek-box");
    reveal.fromTo(greekBoxes, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: "power2.out" }, "-=0.2");

    /* Risk Controls */
    const riskNodes = svg.querySelectorAll(".risk-node");
    reveal.fromTo(riskNodes, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.1");

    /* Paths */
    reveal.to(allPaths, { opacity: 0.5, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Key message */
    const keyMessage = svg.querySelector(".key-message");
    reveal.fromTo(keyMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Orders flow from strategies to position manager */
    STRATEGIES.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-strategy-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-strategy-${i}`);
      if (p && d) animateDot(d, p, loop, 0.4, i * 0.15);
    });

    /* Greeks update animation */
    const greekValues = svg.querySelectorAll(".greek-value");
    loop.to(greekValues, {
      scale: 1.05,
      transformOrigin: "center center",
      duration: 0.2,
      ease: "power2.out",
    }, 0.5);
    loop.to(greekValues, {
      scale: 1,
      duration: 0.2,
      ease: "power2.in",
    }, 0.7);

    /* Animate greek values */
    const deltaEl = svg.querySelector(".delta-value");
    const thetaEl = svg.querySelector(".theta-value");
    const vegaEl = svg.querySelector(".vega-value");
    const pnlEl = svg.querySelector(".pnl-value");

    if (deltaEl && thetaEl && vegaEl && pnlEl) {
      loop.to(greekRefs.current, {
        delta: -0.35,
        theta: 2650,
        vega: -920,
        pnl: 48500,
        duration: 1.0,
        ease: "power1.inOut",
        onUpdate() {
          deltaEl.textContent = greekRefs.current.delta.toFixed(2);
          thetaEl.textContent = `+₹${Math.round(greekRefs.current.theta).toLocaleString()}`;
          vegaEl.textContent = `-₹${Math.abs(Math.round(greekRefs.current.vega)).toLocaleString()}`;
          pnlEl.textContent = `+₹${Math.round(greekRefs.current.pnl).toLocaleString()}`;
        },
      }, 0.5);

      loop.to(greekRefs.current, {
        delta: -0.23,
        theta: 2450,
        vega: -890,
        pnl: 45200,
        duration: 1.0,
        ease: "power1.inOut",
        onUpdate() {
          deltaEl.textContent = greekRefs.current.delta.toFixed(2);
          thetaEl.textContent = `+₹${Math.round(greekRefs.current.theta).toLocaleString()}`;
          vegaEl.textContent = `-₹${Math.abs(Math.round(greekRefs.current.vega)).toLocaleString()}`;
          pnlEl.textContent = `+₹${Math.round(greekRefs.current.pnl).toLocaleString()}`;
        },
      }, 1.8);
    }

    /* Risk checks flow */
    RISK_CONTROLS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-risk-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-risk-${i}`);
      if (p && d) animateDot(d, p, loop, 0.35, 0.9 + i * 0.1);
    });

    /* Check marks appear */
    const checkMarks = svg.querySelectorAll(".risk-check");
    loop.fromTo(checkMarks, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2, stagger: 0.1, ease: "back.out" }, 1.4);
    loop.to(checkMarks, { opacity: 0, duration: 0.3 }, 2.5);

    return () => {
      reveal.kill();
      loop.kill();
      greekRefs.current = { delta: -0.23, theta: 2450, vega: -890, pnl: 45200 };
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Institutional-Grade Risk Controls
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Portfolio-level Greeks, real-time P&L, and automated risk limits
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
        
        {/* Strategies → Position Manager */}
        {STRATEGIES.map((s, i) => (
          <path key={`ps-${i}`} d={pathStrategyToMgr(s)} className={`flow-path path-strategy-${i}`} fill="none" stroke={s.color} strokeWidth={2} />
        ))}

        {/* Position Manager → Risk Controls */}
        {RISK_CONTROLS.map((c, i) => (
          <path key={`pr-${i}`} d={pathMgrToControl(c)} className={`flow-path path-risk-${i}`} fill="none" stroke="var(--accent-coral)" strokeWidth={1.8} />
        ))}

        {/* ═══════════ STRATEGIES ═══════════ */}
        {STRATEGIES.map((s, i) => (
          <g key={`strat-${i}`} className="strategy-node" style={{ opacity: 0 }}>
            <rect x={s.cx - s.w / 2} y={s.cy - s.h / 2} width={s.w} height={s.h} rx={12} fill="var(--bg-card)" stroke={s.color} strokeWidth={1.6} />
            <text x={s.cx} y={s.cy - 10} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">{s.label}</text>
            <text x={s.cx} y={s.cy + 10} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Generating orders</text>
            <text x={s.cx} y={s.cy + 28} textAnchor="middle" className="text-[10px] font-medium" fill={s.color}>Active</text>
          </g>
        ))}

        {/* "Orders" label */}
        <text x={CENTER_X} y={310} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-coral)" style={{ opacity: 0.8 }}>Orders Flow Down</text>

        {/* ═══════════ POSITION MANAGER ═══════════ */}
        <g className="mgr-node" style={{ opacity: 0 }}>
          {/* Outer glow */}
          <rect
            x={POSITION_MGR.cx - POSITION_MGR.w / 2 - 4}
            y={POSITION_MGR.cy - POSITION_MGR.h / 2 - 4}
            width={POSITION_MGR.w + 8}
            height={POSITION_MGR.h + 8}
            rx={20}
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth={2}
            opacity={0.3}
          />
          <rect x={POSITION_MGR.cx - POSITION_MGR.w / 2} y={POSITION_MGR.cy - POSITION_MGR.h / 2} width={POSITION_MGR.w} height={POSITION_MGR.h} rx={18} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={2} />
          
          <text x={POSITION_MGR.cx} y={POSITION_MGR.cy - 80} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-amber)">Position Manager</text>
          <text x={POSITION_MGR.cx} y={POSITION_MGR.cy - 58} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Aggregated Portfolio View</text>

          {/* Greeks boxes */}
          {GREEKS.map((g, i) => {
            const gx = POSITION_MGR.cx - 180 + i * 120;
            const gy = POSITION_MGR.cy - 15;
            return (
              <g key={`greek-${i}`} className="greek-box" style={{ opacity: 0 }}>
                <rect x={gx - 50} y={gy - 30} width={100} height={70} rx={10} fill="var(--bg-secondary)" stroke={g.color} strokeWidth={1.2} />
                <text x={gx} y={gy - 8} textAnchor="middle" className="text-[10px] font-medium" fill="var(--text-muted)">{g.label}</text>
                <text 
                  x={gx} 
                  y={gy + 18} 
                  textAnchor="middle" 
                  className={`text-[16px] font-bold greek-value ${g.label.toLowerCase()}-value`}
                  fill={g.color}
                >
                  {g.value}
                </text>
              </g>
            );
          })}

          <text x={POSITION_MGR.cx} y={POSITION_MGR.cy + 80} textAnchor="middle" className="text-[11px]" fill="var(--accent-emerald)">Real-time aggregation across all strategies</text>
        </g>

        {/* ═══════════ RISK CONTROLS ═══════════ */}
        {RISK_CONTROLS.map((r, i) => (
          <g key={`risk-${i}`} className="risk-node" style={{ opacity: 0 }}>
            <rect x={r.cx - r.w / 2} y={r.cy - r.h / 2} width={r.w} height={r.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.5} />
            <text x={r.cx} y={r.cy - 20} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">{r.label}</text>
            <text x={r.cx} y={r.cy + 5} textAnchor="middle" className="text-[12px] font-semibold" fill="var(--accent-emerald)">{r.value}</text>
            <text x={r.cx} y={r.cy + 25} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Auto-enforced</text>
            
            {/* Check mark */}
            <g className="risk-check" style={{ opacity: 0 }}>
              <circle cx={r.cx + r.w / 2 - 20} cy={r.cy - r.h / 2 + 20} r={14} fill="color-mix(in srgb, var(--accent-emerald) 25%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.5} />
              <text x={r.cx + r.w / 2 - 20} y={r.cy - r.h / 2 + 25} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-emerald)">✓</text>
            </g>
          </g>
        ))}

        {/* ═══════════ KEY MESSAGE ═══════════ */}
        <g className="key-message" style={{ opacity: 0 }}>
          <rect x={CENTER_X - 260} y={VB_H - 60} width={520} height={50} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={CENTER_X} y={VB_H - 32} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">Every Order Validated Against Risk Limits</text>
          <text x={CENTER_X} y={VB_H - 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Automatic stop loss • Margin monitoring • Position caps</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        {STRATEGIES.map((s, i) => (
          <circle key={`ds-${i}`} className={`dot-strategy-${i}`} r={5} fill={s.color} opacity={0} filter="url(#glowAmber)" />
        ))}
        
        {RISK_CONTROLS.map((_, i) => (
          <circle key={`dr-${i}`} className={`dot-risk-${i}`} r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        ))}
      </svg>
    </SlideLayout>
  );
}
