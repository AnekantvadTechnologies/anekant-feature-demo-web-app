import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot } from "./shared/animate-dot";

/* ================================================================
 *  OrderReplicationSlide - "One Trade, Many Accounts"
 *
 *  Shows master-follower order replication:
 *    - Left: Master Account (single strategy)
 *    - Center: Anekant Engine with Replication Manager
 *    - Right: Multiple follower accounts with quantity scaling
 *
 *  Perfect for fund management and prop trading desks.
 * ================================================================ */

interface OrderReplicationSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_X = VB_W / 2;
const CENTER_Y = VB_H / 2 - 20;

/* Master Account (left) */
const MASTER = { cx: 220, cy: CENTER_Y, w: 200, h: 160 };

/* Engine with Replication Manager (center) */
const ENGINE = { cx: CENTER_X, cy: CENTER_Y, w: 280, h: 200 };

/* Follower Accounts (right) */
const FOLLOWER_X = VB_W - 250;
const FOLLOWERS = [
  { cx: FOLLOWER_X, cy: CENTER_Y - 220, w: 200, h: 100, scale: "2x", label: "Client A", sublabel: "High Risk" },
  { cx: FOLLOWER_X, cy: CENTER_Y - 80, w: 200, h: 100, scale: "1x", label: "Client B", sublabel: "Matched" },
  { cx: FOLLOWER_X, cy: CENTER_Y + 60, w: 200, h: 100, scale: "0.5x", label: "Client C", sublabel: "Conservative" },
  { cx: FOLLOWER_X, cy: CENTER_Y + 200, w: 200, h: 100, scale: "0.25x", label: "Client D", sublabel: "Minimal" },
];

/* Broker at bottom */
const BROKER = { cx: CENTER_X, cy: VB_H - 140, w: 160, h: 80 };

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathMasterToEngine(): string {
  return bezierH(MASTER.cx + MASTER.w / 2, MASTER.cy, ENGINE.cx - ENGINE.w / 2, ENGINE.cy - 30);
}

function pathEngineToFollower(follower: typeof FOLLOWERS[0]): string {
  return bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy - 30 + FOLLOWERS.indexOf(follower) * 30, follower.cx - follower.w / 2, follower.cy);
}

function pathFollowerToBroker(follower: typeof FOLLOWERS[0]): string {
  return bezierH(follower.cx - follower.w / 2 + 20, follower.cy + follower.h / 2, BROKER.cx + 40 - FOLLOWERS.indexOf(follower) * 20, BROKER.cy - BROKER.h / 2);
}

function pathBrokerToFollower(follower: typeof FOLLOWERS[0]): string {
  const idx = FOLLOWERS.indexOf(follower);
  const x1 = BROKER.cx + BROKER.w / 2;
  const y1 = BROKER.cy - 10;
  const x2 = follower.cx - follower.w / 2 + 40;
  const y2 = follower.cy + follower.h / 2 - 10;
  return `M ${x1} ${y1} C ${x1 + 60} ${y1 - 40 - idx * 20}, ${x2 - 60} ${y2 + 40}, ${x2} ${y2}`;
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function OrderReplicationSlide({ active }: OrderReplicationSlideProps) {
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

    /* Master account */
    const masterNode = svg.querySelector(".master-node");
    reveal.fromTo(masterNode, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");

    /* Engine */
    const engineNode = svg.querySelector(".engine-node");
    reveal.fromTo(engineNode, { opacity: 0, scale: 0.95, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" }, "-=0.3");

    /* Followers */
    const followerNodes = svg.querySelectorAll(".follower-node");
    reveal.fromTo(followerNodes, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, "-=0.2");

    /* Scale badges */
    const scaleBadges = svg.querySelectorAll(".scale-badge");
    reveal.fromTo(scaleBadges, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.05, ease: "back.out" }, "-=0.1");

    /* Broker */
    const brokerNode = svg.querySelector(".broker-node");
    reveal.fromTo(brokerNode, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* Paths */
    reveal.to(allPaths, { opacity: 0.45, strokeDashoffset: 0, duration: 0.6, stagger: 0.02, ease: "power1.inOut" });

    /* Key message */
    const keyMessage = svg.querySelector(".key-message");
    reveal.fromTo(keyMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.5, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Master → Engine */
    const pMasterEngine = svg.querySelector<SVGPathElement>(".path-master-engine");
    const dMasterEngine = svg.querySelector<SVGCircleElement>(".dot-master-engine");
    if (pMasterEngine && dMasterEngine) animateDot(dMasterEngine, pMasterEngine, loop, 0.4, 0);

    /* Engine → Followers (replicated, parallel) */
    FOLLOWERS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-engine-follower-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-engine-follower-${i}`);
      if (p && d) animateDot(d, p, loop, 0.35, 0.35 + i * 0.06);
    });

    /* Show quantity badges pulse */
    const qtyBadges = svg.querySelectorAll(".qty-badge");
    loop.fromTo(qtyBadges, { scale: 1 }, { scale: 1.1, transformOrigin: "center center", duration: 0.15, ease: "power2.out" }, 0.65);
    loop.to(qtyBadges, { scale: 1, duration: 0.15, ease: "power2.in" }, 0.8);

    /* Followers → Broker (orders) */
    FOLLOWERS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-follower-broker-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-follower-broker-${i}`);
      if (p && d) animateDot(d, p, loop, 0.35, 0.9 + i * 0.05);
    });

    /* Broker → Followers (fills back) */
    FOLLOWERS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-broker-follower-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-broker-follower-${i}`);
      if (p && d) animateDot(d, p, loop, 0.3, 1.4 + i * 0.05);
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
          One Trade, Many Accounts
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Master-follower replication with per-account scaling and risk controls
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
        
        {/* Master → Engine */}
        <path d={pathMasterToEngine()} className="flow-path path-master-engine" fill="none" stroke="var(--accent-amber)" strokeWidth={2.5} />

        {/* Engine → Followers */}
        {FOLLOWERS.map((f, i) => (
          <path key={`ef-${i}`} d={pathEngineToFollower(f)} className={`flow-path path-engine-follower-${i}`} fill="none" stroke="var(--accent-coral)" strokeWidth={2} />
        ))}

        {/* Followers → Broker */}
        {FOLLOWERS.map((f, i) => (
          <path key={`fb-${i}`} d={pathFollowerToBroker(f)} className={`flow-path path-follower-broker-${i}`} fill="none" stroke="var(--accent-coral)" strokeWidth={1.5} opacity={0.7} />
        ))}

        {/* Broker → Followers (fills) */}
        {FOLLOWERS.map((f, i) => (
          <path key={`bf-${i}`} d={pathBrokerToFollower(f)} className={`ret-path path-broker-follower-${i}`} fill="none" stroke="var(--accent-emerald)" strokeWidth={1.4} strokeDasharray="6 4" />
        ))}

        {/* ═══════════ MASTER ACCOUNT ═══════════ */}
        <g className="master-node" style={{ opacity: 0 }}>
          <rect x={MASTER.cx - MASTER.w / 2} y={MASTER.cy - MASTER.h / 2} width={MASTER.w} height={MASTER.h} rx={16} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={2} />
          <text x={MASTER.cx} y={MASTER.cy - 45} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-amber)">Master Account</text>
          <text x={MASTER.cx} y={MASTER.cy - 20} textAnchor="middle" className="text-[12px]" fill="var(--text-muted)">Strategy runs here</text>
          
          {/* Order preview */}
          <rect x={MASTER.cx - 80} y={MASTER.cy} width={160} height={50} rx={8} fill="var(--bg-secondary)" stroke="var(--accent-emerald)" strokeWidth={1} opacity={0.8} />
          <text x={MASTER.cx} y={MASTER.cy + 20} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-emerald)">BUY 10 lots</text>
          <text x={MASTER.cx} y={MASTER.cy + 38} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">NIFTY 22000 CE</text>
        </g>

        {/* ═══════════ ENGINE ═══════════ */}
        <g className="engine-node" style={{ opacity: 0 }}>
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
          
          <text x={ENGINE.cx} y={ENGINE.cy - 60} textAnchor="middle" className="text-[18px] font-bold" fill="var(--accent-amber)">Anekant Engine</text>
          
          {/* Replication Manager box */}
          <rect x={ENGINE.cx - 110} y={ENGINE.cy - 35} width={220} height={70} rx={10} fill="var(--bg-secondary)" stroke="var(--accent-coral)" strokeWidth={1.2} />
          <text x={ENGINE.cx} y={ENGINE.cy - 10} textAnchor="middle" className="text-[13px] font-bold" fill="var(--accent-coral)">Replication Manager</text>
          <text x={ENGINE.cx} y={ENGINE.cy + 10} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Scale • Route • Monitor</text>
          <text x={ENGINE.cx} y={ENGINE.cy + 28} textAnchor="middle" className="text-[10px]" fill="var(--accent-emerald)">Per-account risk controls</text>
          
          <text x={ENGINE.cx} y={ENGINE.cy + 65} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Atomic replication</text>
        </g>

        {/* ═══════════ FOLLOWER ACCOUNTS ═══════════ */}
        {FOLLOWERS.map((f, i) => (
          <g key={`follower-${i}`} className="follower-node" style={{ opacity: 0 }}>
            <rect x={f.cx - f.w / 2} y={f.cy - f.h / 2} width={f.w} height={f.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.5} />
            <text x={f.cx} y={f.cy - 25} textAnchor="middle" className="text-[13px] font-bold" fill="var(--text-primary)">{f.label}</text>
            <text x={f.cx} y={f.cy - 8} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">{f.sublabel}</text>
            
            {/* Quantity badge */}
            <g className="qty-badge">
              <rect x={f.cx - 55} y={f.cy + 5} width={110} height={28} rx={6} fill="color-mix(in srgb, var(--accent-emerald) 20%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1} />
              <text x={f.cx} y={f.cy + 24} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-emerald)">
                {f.scale === "2x" ? "20 lots" : f.scale === "1x" ? "10 lots" : f.scale === "0.5x" ? "5 lots" : "2 lots"}
              </text>
            </g>
            
            {/* Scale badge */}
            <g className="scale-badge" style={{ opacity: 0 }}>
              <rect x={f.cx + f.w / 2 - 45} y={f.cy - f.h / 2 - 12} width={50} height={24} rx={6} fill="color-mix(in srgb, var(--accent-amber) 25%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1} />
              <text x={f.cx + f.w / 2 - 20} y={f.cy - f.h / 2 + 5} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-amber)">{f.scale}</text>
            </g>
          </g>
        ))}

        {/* ═══════════ BROKER ═══════════ */}
        <g className="broker-node" style={{ opacity: 0 }}>
          <rect x={BROKER.cx - BROKER.w / 2} y={BROKER.cy - BROKER.h / 2} width={BROKER.w} height={BROKER.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-orange)" strokeWidth={1.5} />
          <text x={BROKER.cx} y={BROKER.cy - 5} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Broker</text>
          <text x={BROKER.cx} y={BROKER.cy + 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">37 total lots</text>
        </g>

        {/* ═══════════ LABELS ═══════════ */}
        <text x={(MASTER.cx + ENGINE.cx) / 2} y={MASTER.cy - 80} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-amber)" style={{ opacity: 0.8 }}>Original Order</text>
        <text x={(ENGINE.cx + FOLLOWER_X) / 2 - 30} y={CENTER_Y - 160} textAnchor="middle" className="text-[11px] font-medium" fill="var(--accent-coral)" style={{ opacity: 0.8 }}>Scaled Orders</text>
        <text x={BROKER.cx + 130} y={BROKER.cy - 50} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0.8 }}>Fills</text>

        {/* ═══════════ KEY MESSAGE ═══════════ */}
        <g className="key-message" style={{ opacity: 0 }}>
          <rect x={CENTER_X - 240} y={VB_H - 70} width={480} height={55} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={CENTER_X} y={VB_H - 42} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">Manage 100+ Accounts with One Strategy</text>
          <text x={CENTER_X} y={VB_H - 22} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Per-account scaling • Independent risk controls • Real-time monitoring</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        <circle className="dot-master-engine" r={6} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        
        {FOLLOWERS.map((_, i) => (
          <circle key={`def-${i}`} className={`dot-engine-follower-${i}`} r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        ))}
        
        {FOLLOWERS.map((_, i) => (
          <circle key={`dfb-${i}`} className={`dot-follower-broker-${i}`} r={4} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        ))}
        
        {FOLLOWERS.map((_, i) => (
          <circle key={`dbf-${i}`} className={`dot-broker-follower-${i}`} r={4} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
      </svg>
    </SlideLayout>
  );
}
