import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H, bezierH } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot } from "./shared/animate-dot";

/* ================================================================
 *  ObservabilitySlide - "See Everything, In Real-Time"
 *
 *  Shows the complete observability pipeline:
 *    - Left: Engine processing ticks
 *    - Center: Metrics flow (SQLite DB, Metrics API)
 *    - Right: Multiple consumers (Dashboard, AI Agent, Alerts)
 *
 *  Demonstrates production visibility without performance impact.
 * ================================================================ */

interface ObservabilitySlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_Y = VB_H / 2 - 30;

/* Engine (left) */
const ENGINE = { cx: 230, cy: CENTER_Y, w: 200, h: 180 };

/* Metrics storage (center-left) */
const SQLITE = { cx: 520, cy: CENTER_Y - 80, w: 160, h: 90 };

/* Metrics API (center) */
const METRICS_API = { cx: 520, cy: CENTER_Y + 80, w: 160, h: 90 };

/* Consumers (right) */
const CONSUMERS = [
  { cx: VB_W - 280, cy: CENTER_Y - 180, w: 200, h: 100, label: "Command Center", sublabel: "Live Dashboard", icon: "📊" },
  { cx: VB_W - 280, cy: CENTER_Y - 40, w: 200, h: 100, label: "AI Agent", sublabel: "Decision Making", icon: "🤖" },
  { cx: VB_W - 280, cy: CENTER_Y + 100, w: 200, h: 100, label: "Alerting", sublabel: "Threshold Monitoring", icon: "🔔" },
  { cx: VB_W - 280, cy: CENTER_Y + 240, w: 200, h: 100, label: "Analytics", sublabel: "Post-Session Reports", icon: "📈" },
];

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathEngineToSqlite(): string {
  return bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy - 30, SQLITE.cx - SQLITE.w / 2, SQLITE.cy);
}

function pathEngineToApi(): string {
  return bezierH(ENGINE.cx + ENGINE.w / 2, ENGINE.cy + 30, METRICS_API.cx - METRICS_API.w / 2, METRICS_API.cy);
}

function pathSqliteToApi(): string {
  return `M ${SQLITE.cx} ${SQLITE.cy + SQLITE.h / 2} L ${METRICS_API.cx} ${METRICS_API.cy - METRICS_API.h / 2}`;
}

function pathApiToConsumer(consumer: typeof CONSUMERS[0]): string {
  return bezierH(METRICS_API.cx + METRICS_API.w / 2, METRICS_API.cy - 20 + CONSUMERS.indexOf(consumer) * 15, consumer.cx - consumer.w / 2, consumer.cy);
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function ObservabilitySlide({ active }: ObservabilitySlideProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const loopTlRef = useRef<gsap.core.Timeline | null>(null);
  const counterRef = useRef<number>(0);

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

    /* Engine */
    const engineNode = svg.querySelector(".engine-node");
    reveal.fromTo(engineNode, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");

    /* Storage nodes */
    const storageNodes = svg.querySelectorAll(".storage-node");
    reveal.fromTo(storageNodes, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out" }, "-=0.2");

    /* Consumers */
    const consumerNodes = svg.querySelectorAll(".consumer-node");
    reveal.fromTo(consumerNodes, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, "-=0.2");

    /* Paths */
    reveal.to(allPaths, { opacity: 0.45, strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: "power1.inOut" });

    /* Metrics counter */
    const counterBadge = svg.querySelector(".counter-badge");
    reveal.fromTo(counterBadge, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out" }, "-=0.2");

    /* Key message */
    const keyMessage = svg.querySelector(".key-message");
    reveal.fromTo(keyMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.3, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Engine → SQLite */
    const pEngineSqlite = svg.querySelector<SVGPathElement>(".path-engine-sqlite");
    const dEngineSqlite = svg.querySelector<SVGCircleElement>(".dot-engine-sqlite");
    if (pEngineSqlite && dEngineSqlite) animateDot(dEngineSqlite, pEngineSqlite, loop, 0.35, 0);

    /* Engine → Metrics API (direct) */
    const pEngineApi = svg.querySelector<SVGPathElement>(".path-engine-api");
    const dEngineApi = svg.querySelector<SVGCircleElement>(".dot-engine-api");
    if (pEngineApi && dEngineApi) animateDot(dEngineApi, pEngineApi, loop, 0.35, 0.05);

    /* SQLite → Metrics API */
    const pSqliteApi = svg.querySelector<SVGPathElement>(".path-sqlite-api");
    const dSqliteApi = svg.querySelector<SVGCircleElement>(".dot-sqlite-api");
    if (pSqliteApi && dSqliteApi) animateDot(dSqliteApi, pSqliteApi, loop, 0.25, 0.35);

    /* Metrics API → Consumers (parallel) */
    CONSUMERS.forEach((_, i) => {
      const p = svg.querySelector<SVGPathElement>(`.path-api-consumer-${i}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-api-consumer-${i}`);
      if (p && d) animateDot(d, p, loop, 0.4, 0.5 + i * 0.06);
    });

    /* Animate metrics counter */
    const counterEl = svg.querySelector(".metrics-counter");
    if (counterEl) {
      loop.to(counterRef, {
        current: 15000,
        duration: 1.5,
        ease: "power1.inOut",
        onUpdate() {
          counterEl.textContent = Math.round(counterRef.current).toLocaleString();
        },
      }, 0);

      loop.to(counterRef, {
        current: 15000,
        duration: 0.5,
      });
    }

    /* Pulse consumers when they receive data */
    CONSUMERS.forEach((_, i) => {
      const consumerBox = svg.querySelector(`.consumer-${i}`);
      if (consumerBox) {
        loop.to(consumerBox, { 
          attr: { "stroke-width": 2.5 }, 
          duration: 0.15, 
          ease: "power2.out" 
        }, 0.9 + i * 0.1);
        loop.to(consumerBox, { 
          attr: { "stroke-width": 1.5 }, 
          duration: 0.2, 
          ease: "power2.in" 
        }, 1.05 + i * 0.1);
      }
    });

    return () => {
      reveal.kill();
      loop.kill();
      counterRef.current = 0;
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          See Everything, In Real-Time
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Production visibility without performance impact
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
        
        {/* Engine → SQLite */}
        <path d={pathEngineToSqlite()} className="flow-path path-engine-sqlite" fill="none" stroke="var(--accent-amber)" strokeWidth={2} />

        {/* Engine → Metrics API (direct memory metrics) */}
        <path d={pathEngineToApi()} className="flow-path path-engine-api" fill="none" stroke="var(--accent-coral)" strokeWidth={2} />

        {/* SQLite → Metrics API */}
        <path d={pathSqliteToApi()} className="flow-path path-sqlite-api" fill="none" stroke="var(--accent-amber)" strokeWidth={1.8} />

        {/* Metrics API → Consumers */}
        {CONSUMERS.map((c, i) => (
          <path key={`pac-${i}`} d={pathApiToConsumer(c)} className={`flow-path path-api-consumer-${i}`} fill="none" stroke="var(--accent-emerald)" strokeWidth={1.8} />
        ))}

        {/* ═══════════ ENGINE ═══════════ */}
        <g className="engine-node" style={{ opacity: 0 }}>
          <rect
            x={ENGINE.cx - ENGINE.w / 2 - 4}
            y={ENGINE.cy - ENGINE.h / 2 - 4}
            width={ENGINE.w + 8}
            height={ENGINE.h + 8}
            rx={18}
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth={2}
            opacity={0.3}
          />
          <rect x={ENGINE.cx - ENGINE.w / 2} y={ENGINE.cy - ENGINE.h / 2} width={ENGINE.w} height={ENGINE.h} rx={16} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={2} />
          
          <text x={ENGINE.cx} y={ENGINE.cy - 50} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-amber)">Anekant Engine</text>
          
          {/* Metrics items */}
          <rect x={ENGINE.cx - 75} y={ENGINE.cy - 30} width={150} height={32} rx={6} fill="var(--bg-secondary)" stroke="var(--accent-emerald)" strokeWidth={0.8} />
          <text x={ENGINE.cx} y={ENGINE.cy - 9} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-emerald)">Candles, Indicators</text>

          <rect x={ENGINE.cx - 75} y={ENGINE.cy + 10} width={150} height={32} rx={6} fill="var(--bg-secondary)" stroke="var(--accent-coral)" strokeWidth={0.8} />
          <text x={ENGINE.cx} y={ENGINE.cy + 31} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-coral)">Positions, P&L</text>

          <rect x={ENGINE.cx - 75} y={ENGINE.cy + 50} width={150} height={32} rx={6} fill="var(--bg-secondary)" stroke="var(--accent-amber)" strokeWidth={0.8} />
          <text x={ENGINE.cx} y={ENGINE.cy + 71} textAnchor="middle" className="text-[11px] font-semibold" fill="var(--accent-amber)">Strategy State</text>
        </g>

        {/* ═══════════ SQLITE ═══════════ */}
        <g className="storage-node" style={{ opacity: 0 }}>
          <rect x={SQLITE.cx - SQLITE.w / 2} y={SQLITE.cy - SQLITE.h / 2} width={SQLITE.w} height={SQLITE.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.5} />
          <text x={SQLITE.cx} y={SQLITE.cy - 15} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">SQLite DB</text>
          <text x={SQLITE.cx} y={SQLITE.cy + 5} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">Persistent Storage</text>
          <text x={SQLITE.cx} y={SQLITE.cy + 22} textAnchor="middle" className="text-[10px]" fill="var(--accent-emerald)">WAL Mode</text>
        </g>

        {/* ═══════════ METRICS API ═══════════ */}
        <g className="storage-node" style={{ opacity: 0 }}>
          <rect x={METRICS_API.cx - METRICS_API.w / 2} y={METRICS_API.cy - METRICS_API.h / 2} width={METRICS_API.w} height={METRICS_API.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-coral)" strokeWidth={1.5} />
          <text x={METRICS_API.cx} y={METRICS_API.cy - 15} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">Metrics API</text>
          <text x={METRICS_API.cx} y={METRICS_API.cy + 5} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">FastAPI Sidecar</text>
          <text x={METRICS_API.cx} y={METRICS_API.cy + 22} textAnchor="middle" className="text-[10px]" fill="var(--accent-coral)">REST + Charts</text>
        </g>

        {/* ═══════════ CONSUMERS ═══════════ */}
        {CONSUMERS.map((c, i) => (
          <g key={`consumer-${i}`} className="consumer-node" style={{ opacity: 0 }}>
            <rect className={`consumer-${i}`} x={c.cx - c.w / 2} y={c.cy - c.h / 2} width={c.w} height={c.h} rx={12} fill="var(--bg-card)" stroke="var(--accent-emerald)" strokeWidth={1.5} />
            <text x={c.cx} y={c.cy - 20} textAnchor="middle" className="text-[14px] font-bold" fill="var(--text-primary)">{c.label}</text>
            <text x={c.cx} y={c.cy + 2} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">{c.sublabel}</text>
            <text x={c.cx} y={c.cy + 25} textAnchor="middle" className="text-[11px]" fill="var(--accent-emerald)">Real-time</text>
          </g>
        ))}

        {/* ═══════════ METRICS COUNTER ═══════════ */}
        <g className="counter-badge" style={{ opacity: 0 }}>
          <rect x={ENGINE.cx - 80} y={ENGINE.cy + ENGINE.h / 2 + 30} width={160} height={60} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text className="metrics-counter text-[20px] font-bold" x={ENGINE.cx} y={ENGINE.cy + ENGINE.h / 2 + 60} textAnchor="middle" fill="var(--accent-amber)">15,000</text>
          <text x={ENGINE.cx} y={ENGINE.cy + ENGINE.h / 2 + 80} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">metrics/second</text>
        </g>

        {/* ═══════════ STORAGE MODE BADGES ═══════════ */}
        <g className="storage-node" style={{ opacity: 0 }}>
          <rect x={SQLITE.cx + SQLITE.w / 2 + 20} y={SQLITE.cy - 50} width={140} height={100} rx={10} fill="color-mix(in srgb, var(--accent-emerald) 12%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1} />
          <text x={SQLITE.cx + SQLITE.w / 2 + 90} y={SQLITE.cy - 28} textAnchor="middle" className="text-[11px] font-bold" fill="var(--accent-emerald)">Storage Modes</text>
          <text x={SQLITE.cx + SQLITE.w / 2 + 90} y={SQLITE.cy - 8} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">• MEMORY (fast)</text>
          <text x={SQLITE.cx + SQLITE.w / 2 + 90} y={SQLITE.cy + 8} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">• DATABASE (persist)</text>
          <text x={SQLITE.cx + SQLITE.w / 2 + 90} y={SQLITE.cy + 24} textAnchor="middle" className="text-[9px]" fill="var(--text-muted)">• DUAL (both)</text>
        </g>

        {/* ═══════════ LABELS ═══════════ */}
        <text x={(ENGINE.cx + SQLITE.cx) / 2 - 20} y={ENGINE.cy - 80} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-amber)" style={{ opacity: 0.8 }}>Persist</text>
        <text x={(ENGINE.cx + METRICS_API.cx) / 2 - 30} y={ENGINE.cy + 80} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-coral)" style={{ opacity: 0.8 }}>Stream</text>
        <text x={(METRICS_API.cx + VB_W - 280) / 2} y={CENTER_Y - 100} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-emerald)" style={{ opacity: 0.8 }}>Serve</text>

        {/* ═══════════ KEY MESSAGE ═══════════ */}
        <g className="key-message" style={{ opacity: 0 }}>
          <rect x={VB_W / 2 - 240} y={VB_H - 60} width={480} height={50} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={VB_W / 2} y={VB_H - 32} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">Zero Performance Impact on Trading</text>
          <text x={VB_W / 2} y={VB_H - 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Async writes • Concurrent reads • Full session replay</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        <circle className="dot-engine-sqlite" r={5} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        <circle className="dot-engine-api" r={5} fill="var(--accent-coral)" opacity={0} filter="url(#glowCoral)" />
        <circle className="dot-sqlite-api" r={5} fill="var(--accent-amber)" opacity={0} filter="url(#glowAmber)" />
        
        {CONSUMERS.map((_, i) => (
          <circle key={`dac-${i}`} className={`dot-api-consumer-${i}`} r={5} fill="var(--accent-emerald)" opacity={0} filter="url(#glowGreen)" />
        ))}
      </svg>
    </SlideLayout>
  );
}
