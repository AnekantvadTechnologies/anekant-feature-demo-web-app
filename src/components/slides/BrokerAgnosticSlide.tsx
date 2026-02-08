import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot, animateDotReverse } from "./shared/animate-dot";

/* ================================================================
 *  BrokerAgnosticSlide - "One Strategy, Any Broker"
 *
 *  Shows how the same strategy code can route to different brokers:
 *    - Top: Strategy code (single box)
 *    - Middle: Engine with OMS Abstraction
 *    - Bottom: Multiple brokers (Zerodha, XTS, future brokers)
 *
 *  Demonstrates broker flexibility and no vendor lock-in.
 * ================================================================ */

interface BrokerAgnosticSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_X = VB_W / 2;

/* Strategy at top */
const STRATEGY = { cx: CENTER_X, cy: 180, w: 280, h: 120 };

/* Engine with OMS in middle */
const ENGINE = { cx: CENTER_X, cy: 420, w: 400, h: 200 };

/* Brokers at bottom */
const BROKERS = [
  { cx: 300, cy: 700, w: 180, h: 110, label: "Zerodha Kite", sublabel: "Retail", status: "Live", color: "var(--accent-emerald)" },
  { cx: CENTER_X, cy: 700, w: 180, h: 110, label: "Jainam XTS", sublabel: "Institutional", status: "Live", color: "var(--accent-amber)" },
  { cx: VB_W - 300, cy: 700, w: 180, h: 110, label: "Your Broker", sublabel: "Custom", status: "Plugin Ready", color: "var(--accent-coral)" },
];

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathStrategyToEngine(): string {
  return `M ${STRATEGY.cx} ${STRATEGY.cy + STRATEGY.h / 2} L ${ENGINE.cx} ${ENGINE.cy - ENGINE.h / 2}`;
}

function pathEngineToBroker(broker: typeof BROKERS[0]): string {
  const idx = BROKERS.indexOf(broker);
  const startX = ENGINE.cx - 120 + idx * 120;
  return bezierH(startX, ENGINE.cy + ENGINE.h / 2, broker.cx, broker.cy - broker.h / 2);
}

function pathBrokerToEngine(broker: typeof BROKERS[0]): string {
  const idx = BROKERS.indexOf(broker);
  const endX = ENGINE.cx - 100 + idx * 100;
  return bezierH(broker.cx + 30, broker.cy - broker.h / 2, endX + 30, ENGINE.cy + ENGINE.h / 2);
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function BrokerAgnosticSlide({ active }: BrokerAgnosticSlideProps) {
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

    /* Strategy */
    const strategyNode = svg.querySelector(".strategy-node");
    reveal.fromTo(strategyNode, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");

    /* Engine */
    const engineNode = svg.querySelector(".engine-node");
    reveal.fromTo(engineNode, { opacity: 0, scale: 0.95, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" }, "-=0.2");

    /* OMS box */
    const omsBox = svg.querySelector(".oms-box");
    reveal.fromTo(omsBox, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out" }, "-=0.2");

    /* Brokers */
    const brokerNodes = svg.querySelectorAll(".broker-node");
    reveal.fromTo(brokerNodes, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.1");

    /* Paths */
    reveal.to(allPaths, { opacity: 0.45, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Benefits callouts */
    const benefits = svg.querySelectorAll(".benefit");
    reveal.fromTo(benefits, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.3");

    /* Key message */
    const keyMessage = svg.querySelector(".key-message");
    reveal.fromTo(keyMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Strategy → Engine */
    const pStratEngine = svg.querySelector<SVGPathElement>(".path-strat-engine");
    const dStratEngine = svg.querySelector<SVGCircleElement>(".dot-strat-engine");
    if (pStratEngine && dStratEngine) animateDot(dStratEngine, pStratEngine, loop, 0.4, 0);

    /* OMS routing animation - highlight each broker adapter */
    const adapters = svg.querySelectorAll(".adapter-box");
    adapters.forEach((adapter, i) => {
      loop.to(adapter, { 
        attr: { "stroke-width": 2.5 }, 
        duration: 0.15, 
        ease: "power2.out" 
      }, 0.4 + i * 0.15);
      loop.to(adapter, { 
        attr: { "stroke-width": 1 }, 
        duration: 0.15, 
        ease: "power2.in" 
      }, 0.55 + i * 0.15);
    });

    /* Engine → Brokers (parallel) */
    BROKERS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-engine-broker-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-engine-broker-${i}`);
      if (p && d) animateDot(d, p, loop, 0.4, 0.7 + i * 0.08);
    });

    /* Brokers → Engine (fills back) */
    BROKERS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-broker-engine-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-broker-engine-${i}`);
      if (p && d) animateDotReverse(d, p, loop, 0.35, 1.2 + i * 0.06);
    });

    /* Pad loop */
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
          One Strategy, Any Broker
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Broker-agnostic architecture — switch without code changes
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
        
        {/* Strategy → Engine */}
        <path d={pathStrategyToEngine()} className="flow-path path-strat-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2.5} />

        {/* Engine → Brokers */}
        {BROKERS.map((b, i) => (
          <path key={`peb-${i}`} d={pathEngineToBroker(b)} className={`flow-path path-engine-broker-${i}`} fill="none" stroke={b.color} strokeWidth={2} />
        ))}

        {/* Brokers → Engine (fills) */}
        {BROKERS.map((b, i) => (
          <path key={`pbe-${i}`} d={pathBrokerToEngine(b)} className={`ret-path path-broker-engine-${i}`} fill="none" stroke="var(--accent-emerald)" strokeWidth={1.5} strokeDasharray="6 4" />
        ))}

        {/* ═══════════ STRATEGY ═══════════ */}
        <g className="strategy-node" style={{ opacity: 0 }}>
          <rect x={STRATEGY.cx - STRATEGY.w / 2} y={STRATEGY.cy - STRATEGY.h / 2} width={STRATEGY.w} height={STRATEGY.h} rx={16} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={2} />
          <text x={STRATEGY.cx} y={STRATEGY.cy - 25} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-amber)">Your Strategy</text>
          <text x={STRATEGY.cx} y={STRATEGY.cy} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Same code for all brokers</text>
          
          {/* Code snippet */}
          <rect x={STRATEGY.cx - 100} y={STRATEGY.cy + 15} width={200} height={30} rx={6} fill="var(--bg-secondary)" stroke="var(--border-subtle)" strokeWidth={0.8} />
          <text x={STRATEGY.cx} y={STRATEGY.cy + 35} textAnchor="middle" className="text-[10px] font-mono" fill="var(--accent-emerald)">self.oms.place_order(...)</text>
        </g>

        {/* ═══════════ ENGINE ═══════════ */}
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
          <rect x={ENGINE.cx - ENGINE.w / 2} y={ENGINE.cy - ENGINE.h / 2} width={ENGINE.w} height={ENGINE.h} rx={18} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={2} />
          
          <text x={ENGINE.cx} y={ENGINE.cy - 70} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-amber)">Anekant Engine</text>

          {/* OMS Abstraction box */}
          <g className="oms-box" style={{ opacity: 0 }}>
            <rect x={ENGINE.cx - 170} y={ENGINE.cy - 45} width={340} height={100} rx={12} fill="var(--bg-secondary)" stroke="var(--accent-coral)" strokeWidth={1.5} />
            <text x={ENGINE.cx} y={ENGINE.cy - 20} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-coral)">OMS Abstraction Layer</text>
            
            {/* Broker adapters */}
            <rect className="adapter-box" x={ENGINE.cx - 150} y={ENGINE.cy} width={90} height={35} rx={6} fill="var(--bg-card)" stroke="var(--accent-emerald)" strokeWidth={1} />
            <text x={ENGINE.cx - 105} y={ENGINE.cy + 22} textAnchor="middle" className="text-[9px] font-semibold" fill="var(--accent-emerald)">KiteAdapter</text>

            <rect className="adapter-box" x={ENGINE.cx - 45} y={ENGINE.cy} width={90} height={35} rx={6} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1} />
            <text x={ENGINE.cx} y={ENGINE.cy + 22} textAnchor="middle" className="text-[9px] font-semibold" fill="var(--accent-amber)">XTSAdapter</text>

            <rect className="adapter-box" x={ENGINE.cx + 60} y={ENGINE.cy} width={90} height={35} rx={6} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1} />
            <text x={ENGINE.cx + 105} y={ENGINE.cy + 22} textAnchor="middle" className="text-[9px] font-semibold" fill="var(--accent-coral)">CustomAdapter</text>
          </g>

          <text x={ENGINE.cx} y={ENGINE.cy + 75} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Unified interface, multiple implementations</text>
        </g>

        {/* ═══════════ BROKERS ═══════════ */}
        {BROKERS.map((b, i) => (
          <g key={`broker-${i}`} className="broker-node" style={{ opacity: 0 }}>
            <rect x={b.cx - b.w / 2} y={b.cy - b.h / 2} width={b.w} height={b.h} rx={14} fill="var(--bg-card)" stroke={b.color} strokeWidth={1.6} />
            <text x={b.cx} y={b.cy - 25} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">{b.label}</text>
            <text x={b.cx} y={b.cy - 5} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">{b.sublabel}</text>
            
            {/* Status badge */}
            <rect x={b.cx - 45} y={b.cy + 10} width={90} height={24} rx={6} fill={`color-mix(in srgb, ${b.color} 20%, var(--bg-card))`} stroke={b.color} strokeWidth={0.8} />
            <text x={b.cx} y={b.cy + 27} textAnchor="middle" className="text-[10px] font-semibold" fill={b.color}>{b.status}</text>
          </g>
        ))}

        {/* ═══════════ BENEFITS ═══════════ */}
        <g className="benefit" style={{ opacity: 0 }}>
          <rect x={50} y={400} width={200} height={28} rx={6} fill="color-mix(in srgb, var(--accent-emerald) 15%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={0.8} />
          <text x={150} y={419} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-emerald)">✓ No vendor lock-in</text>
        </g>

        <g className="benefit" style={{ opacity: 0 }}>
          <rect x={50} y={438} width={200} height={28} rx={6} fill="color-mix(in srgb, var(--accent-emerald) 15%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={0.8} />
          <text x={150} y={457} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-emerald)">✓ Add brokers via plugins</text>
        </g>

        <g className="benefit" style={{ opacity: 0 }}>
          <rect x={50} y={476} width={200} height={28} rx={6} fill="color-mix(in srgb, var(--accent-emerald) 15%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={0.8} />
          <text x={150} y={495} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-emerald)">✓ Mix data + execution</text>
        </g>

        {/* ═══════════ DATA/EXECUTION SPLIT ═══════════ */}
        <g className="benefit" style={{ opacity: 0 }}>
          <rect x={VB_W - 280} y={550} width={230} height={60} rx={10} fill="color-mix(in srgb, var(--accent-amber) 12%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1} />
          <text x={VB_W - 165} y={575} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-amber)">Mix & Match</text>
          <text x={VB_W - 165} y={595} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Data from Kite, Orders to XTS</text>
        </g>

        {/* Labels */}
        <text x={CENTER_X} y={285} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-amber)" style={{ opacity: 0.8 }}>Order Intent</text>
        <text x={CENTER_X - 150} y={635} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-coral)" style={{ opacity: 0.8 }}>Orders</text>
        <text x={CENTER_X + 150} y={635} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0.8 }}>Fills</text>

        {/* ═══════════ KEY MESSAGE ═══════════ */}
        <g className="key-message" style={{ opacity: 0 }}>
          <rect x={CENTER_X - 220} y={VB_H - 60} width={440} height={50} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={CENTER_X} y={VB_H - 32} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">Switch Brokers Without Touching Strategy Code</text>
          <text x={CENTER_X} y={VB_H - 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Same interface • Different implementations • Zero rewrites</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        <circle className="dot-strat-engine" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        
        {BROKERS.map((b, i) => (
          <circle key={`deb-${i}`} className={`dot-engine-broker-${i}`} r={5} fill={b.color} opacity={0} filter="url(#glowAmber)" />
        ))}
        
        {BROKERS.map((_, i) => (
          <circle key={`dbe-${i}`} className={`dot-broker-engine-${i}`} r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
      </svg>
    </SlideLayout>
  );
}
