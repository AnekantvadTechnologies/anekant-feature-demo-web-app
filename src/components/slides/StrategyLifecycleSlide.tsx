import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SlideLayout } from "@/components/layout/SlideLayout";
import { VB_W, VB_H } from "./shared/constants";
import { StandardDefs } from "./shared/svg-helpers";
import { animateDot } from "./shared/animate-dot";

/* ================================================================
 *  StrategyLifecycleSlide - "Predictable Strategy Behavior"
 *
 *  Shows the state machine controlling strategy lifecycle:
 *    - INITIALIZE → START → CREATE → MANAGE → END
 *    - FAILED state with recovery paths
 *
 *  Demonstrates auditable, predictable state transitions.
 * ================================================================ */

interface StrategyLifecycleSlideProps {
  active: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  LAYOUT CONSTANTS
 * ──────────────────────────────────────────────────────────── */
const CENTER_Y = VB_H / 2 - 50;

/* State boxes */
const STATES = [
  { cx: 200, cy: CENTER_Y, w: 160, h: 100, label: "INITIALIZE", sublabel: "Load config", color: "var(--accent-amber)" },
  { cx: 440, cy: CENTER_Y, w: 160, h: 100, label: "START", sublabel: "Connect broker", color: "var(--accent-amber)" },
  { cx: 680, cy: CENTER_Y, w: 160, h: 100, label: "CREATE", sublabel: "Open positions", color: "var(--accent-coral)" },
  { cx: 920, cy: CENTER_Y, w: 160, h: 100, label: "MANAGE", sublabel: "Monitor & adjust", color: "var(--accent-emerald)" },
  { cx: 1160, cy: CENTER_Y, w: 160, h: 100, label: "END", sublabel: "Close & report", color: "var(--accent-amber)" },
];

/* Failed state below */
const FAILED = { cx: VB_W / 2, cy: CENTER_Y + 200, w: 200, h: 90 };

/* ────────────────────────────────────────────────────────────
 *  PATH BUILDERS
 * ──────────────────────────────────────────────────────────── */
function pathBetweenStates(from: typeof STATES[0], to: typeof STATES[0]): string {
  return `M ${from.cx + from.w / 2} ${from.cy} L ${to.cx - to.w / 2} ${to.cy}`;
}

function pathStateToFailed(state: typeof STATES[0]): string {
  return `M ${state.cx} ${state.cy + state.h / 2} Q ${state.cx} ${FAILED.cy - 60}, ${FAILED.cx - 80 + STATES.indexOf(state) * 40} ${FAILED.cy - FAILED.h / 2}`;
}

function pathFailedToStart(): string {
  return `M ${FAILED.cx - FAILED.w / 2} ${FAILED.cy - 20} Q ${STATES[1].cx - 100} ${FAILED.cy - 20}, ${STATES[1].cx - 60} ${STATES[1].cy + STATES[1].h / 2}`;
}

function pathEndToStart(): string {
  const start = STATES[4];
  const end = STATES[1];
  return `M ${start.cx} ${start.cy - start.h / 2} Q ${(start.cx + end.cx) / 2} ${CENTER_Y - 150}, ${end.cx} ${end.cy - end.h / 2}`;
}

function pathManageToCreate(): string {
  const manage = STATES[3];
  const create = STATES[2];
  return `M ${manage.cx - 40} ${manage.cy - manage.h / 2} Q ${(manage.cx + create.cx) / 2} ${CENTER_Y - 80}, ${create.cx + 40} ${create.cy - create.h / 2}`;
}

/* ================================================================
 *  COMPONENT
 * ================================================================ */
export function StrategyLifecycleSlide({ active }: StrategyLifecycleSlideProps) {
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

    const allPaths = svg.querySelectorAll<SVGPathElement>(".flow-path, .fail-path, .recovery-path");
    allPaths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { opacity: 0, strokeDasharray: len, strokeDashoffset: len });
    });

    reveal.fromTo(titleRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });

    /* State boxes */
    const stateNodes = svg.querySelectorAll(".state-node");
    reveal.fromTo(stateNodes, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.2");

    /* State numbers */
    const stateNumbers = svg.querySelectorAll(".state-number");
    reveal.fromTo(stateNumbers, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: "back.out" }, "-=0.3");

    /* Forward paths */
    const forwardPaths = svg.querySelectorAll(".flow-path");
    reveal.to(forwardPaths, { opacity: 0.5, strokeDashoffset: 0, duration: 0.5, stagger: 0.08, ease: "power1.inOut" });

    /* Failed state */
    const failedNode = svg.querySelector(".failed-node");
    reveal.fromTo(failedNode, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out" }, "-=0.2");

    /* Failure paths */
    const failPaths = svg.querySelectorAll(".fail-path");
    reveal.to(failPaths, { opacity: 0.3, strokeDashoffset: 0, duration: 0.5, stagger: 0.05, ease: "power1.inOut" });

    /* Recovery paths */
    const recoveryPaths = svg.querySelectorAll(".recovery-path");
    reveal.to(recoveryPaths, { opacity: 0.4, strokeDashoffset: 0, duration: 0.5, stagger: 0.1, ease: "power1.inOut" });

    /* Key message */
    const keyMessage = svg.querySelector(".key-message");
    reveal.fromTo(keyMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* ──────── LOOPING TIMELINE ──────── */
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.5, paused: true });
    loopTlRef.current = loop;

    reveal.eventCallback("onComplete", () => { loop.play(); });

    /* Main flow: INITIALIZE → START → CREATE → MANAGE → END */
    for (let i = 0; i < STATES.length - 1; i++) {
      const p = svg.querySelector<SVGPathElement>(`.path-state-${i}-${i + 1}`);
      const d = svg.querySelector<SVGCircleElement>(`.dot-state-${i}-${i + 1}`);
      if (p && d) animateDot(d, p, loop, 0.4, i * 0.5);

      /* Highlight current state */
      const stateBox = svg.querySelector(`.state-box-${i}`);
      if (stateBox) {
        loop.to(stateBox, { 
          attr: { "stroke-width": 3 }, 
          duration: 0.15, 
          ease: "power2.out" 
        }, i * 0.5);
        loop.to(stateBox, { 
          attr: { "stroke-width": 1.8 }, 
          duration: 0.25, 
          ease: "power2.in" 
        }, i * 0.5 + 0.3);
      }
    }

    /* Final state highlight */
    const lastStateBox = svg.querySelector(`.state-box-4`);
    if (lastStateBox) {
      loop.to(lastStateBox, { 
        attr: { "stroke-width": 3 }, 
        duration: 0.15, 
        ease: "power2.out" 
      }, 2.0);
      loop.to(lastStateBox, { 
        attr: { "stroke-width": 1.8 }, 
        duration: 0.25, 
        ease: "power2.in" 
      }, 2.3);
    }

    /* Checkmarks appear at each state */
    for (let i = 0; i < STATES.length; i++) {
      const check = svg.querySelector(`.state-check-${i}`);
      if (check) {
        loop.fromTo(check, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out" }, i * 0.5 + 0.3);
      }
    }

    /* Reset checkmarks */
    const allChecks = svg.querySelectorAll("[class^='state-check']");
    loop.to(allChecks, { opacity: 0, duration: 0.2 }, 2.8);

    return () => {
      reveal.kill();
      loop.kill();
    };
  }, [active]);

  return (
    <SlideLayout className="justify-start pt-6">
      <div ref={titleRef} className="mb-3 text-center opacity-0">
        <h2 className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Predictable Strategy Behavior
        </h2>
        <p className="mt-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          Every state transition is validated and auditable
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

        {/* ═══════════ FORWARD PATHS ═══════════ */}
        {STATES.slice(0, -1).map((state, i) => (
          <path 
            key={`pf-${i}`} 
            d={pathBetweenStates(state, STATES[i + 1])} 
            className={`flow-path path-state-${i}-${i + 1}`} 
            fill="none" 
            stroke="var(--accent-emerald)" 
            strokeWidth={2.5} 
          />
        ))}

        {/* ═══════════ FAILURE PATHS ═══════════ */}
        {STATES.slice(0, -1).map((state, i) => (
          <path 
            key={`pfail-${i}`} 
            d={pathStateToFailed(state)} 
            className="fail-path" 
            fill="none" 
            stroke="var(--accent-red)" 
            strokeWidth={1.2} 
            strokeDasharray="4 3"
          />
        ))}

        {/* ═══════════ RECOVERY PATHS ═══════════ */}
        <path d={pathFailedToStart()} className="recovery-path" fill="none" stroke="var(--accent-amber)" strokeWidth={1.8} strokeDasharray="6 4" />
        <path d={pathEndToStart()} className="recovery-path" fill="none" stroke="var(--accent-coral)" strokeWidth={1.5} strokeDasharray="6 4" />
        <path d={pathManageToCreate()} className="recovery-path" fill="none" stroke="var(--accent-coral)" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* ═══════════ STATE BOXES ═══════════ */}
        {STATES.map((state, i) => (
          <g key={`state-${i}`} className="state-node" style={{ opacity: 0 }}>
            <rect 
              className={`state-box-${i}`}
              x={state.cx - state.w / 2} 
              y={state.cy - state.h / 2} 
              width={state.w} 
              height={state.h} 
              rx={14} 
              fill="var(--bg-card)" 
              stroke={state.color} 
              strokeWidth={1.8} 
            />
            
            {/* State number */}
            <g className="state-number" style={{ opacity: 0 }}>
              <circle cx={state.cx - state.w / 2 + 20} cy={state.cy - state.h / 2 + 20} r={14} fill={state.color} />
              <text x={state.cx - state.w / 2 + 20} y={state.cy - state.h / 2 + 25} textAnchor="middle" className="text-[12px] font-bold" fill="var(--bg-primary)">{i + 1}</text>
            </g>
            
            <text x={state.cx} y={state.cy - 10} textAnchor="middle" className="text-[14px] font-bold" fill={state.color}>{state.label}</text>
            <text x={state.cx} y={state.cy + 12} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">{state.sublabel}</text>
            
            {/* Checkmark */}
            <g className={`state-check-${i}`} style={{ opacity: 0 }}>
              <circle cx={state.cx + state.w / 2 - 20} cy={state.cy + state.h / 2 - 20} r={12} fill="color-mix(in srgb, var(--accent-emerald) 25%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1.5} />
              <text x={state.cx + state.w / 2 - 20} y={state.cy + state.h / 2 - 15} textAnchor="middle" className="text-[12px] font-bold" fill="var(--accent-emerald)">✓</text>
            </g>
          </g>
        ))}

        {/* ═══════════ FAILED STATE ═══════════ */}
        <g className="failed-node" style={{ opacity: 0 }}>
          <rect 
            x={FAILED.cx - FAILED.w / 2} 
            y={FAILED.cy - FAILED.h / 2} 
            width={FAILED.w} 
            height={FAILED.h} 
            rx={14} 
            fill="var(--bg-card)" 
            stroke="var(--accent-red)" 
            strokeWidth={1.8} 
          />
          <text x={FAILED.cx} y={FAILED.cy - 15} textAnchor="middle" className="text-[16px] font-bold" fill="var(--accent-red)">FAILED</text>
          <text x={FAILED.cx} y={FAILED.cy + 8} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">Terminal state</text>
          <text x={FAILED.cx} y={FAILED.cy + 26} textAnchor="middle" className="text-[10px]" fill="var(--accent-amber)">Recovery available</text>
        </g>

        {/* ═══════════ PATH LABELS ═══════════ */}
        <text x={(STATES[4].cx + STATES[1].cx) / 2} y={CENTER_Y - 140} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-coral)">Restart Strategy</text>
        <text x={(STATES[3].cx + STATES[2].cx) / 2} y={CENTER_Y - 70} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-coral)">Add Position</text>
        <text x={FAILED.cx - 130} y={FAILED.cy - 30} textAnchor="middle" className="text-[10px] font-medium" fill="var(--accent-amber)">Recover</text>
        <text x={STATES[1].cx + 50} y={CENTER_Y + 150} textAnchor="middle" className="text-[9px] font-medium" fill="var(--accent-red)" opacity={0.7}>Any state can fail</text>

        {/* ═══════════ BENEFITS BOX ═══════════ */}
        <g className="state-node" style={{ opacity: 0 }}>
          <rect x={VB_W - 280} y={CENTER_Y + 120} width={230} height={130} rx={12} fill="color-mix(in srgb, var(--accent-emerald) 12%, var(--bg-card))" stroke="var(--accent-emerald)" strokeWidth={1} />
          <text x={VB_W - 165} y={CENTER_Y + 150} textAnchor="middle" className="text-[12px] font-bold" fill="var(--accent-emerald)">Benefits</text>
          <text x={VB_W - 260} y={CENTER_Y + 175} className="text-[10px]" fill="var(--text-muted)">• Validated transitions</text>
          <text x={VB_W - 260} y={CENTER_Y + 195} className="text-[10px]" fill="var(--text-muted)">• Full audit trail</text>
          <text x={VB_W - 260} y={CENTER_Y + 215} className="text-[10px]" fill="var(--text-muted)">• Graceful recovery</text>
          <text x={VB_W - 260} y={CENTER_Y + 235} className="text-[10px]" fill="var(--text-muted)">• Testable states</text>
        </g>

        {/* ═══════════ KEY MESSAGE ═══════════ */}
        <g className="key-message" style={{ opacity: 0 }}>
          <rect x={VB_W / 2 - 250} y={VB_H - 60} width={500} height={50} rx={10} fill="color-mix(in srgb, var(--accent-amber) 15%, var(--bg-card))" stroke="var(--accent-amber)" strokeWidth={1.2} />
          <text x={VB_W / 2} y={VB_H - 32} textAnchor="middle" className="text-[14px] font-bold" fill="var(--accent-amber)">State Machine Enforces Valid Transitions Only</text>
          <text x={VB_W / 2} y={VB_H - 14} textAnchor="middle" className="text-[11px]" fill="var(--text-muted)">No undefined behavior • Every transition logged • Recovery paths defined</text>
        </g>

        {/* ═══════════ FLOW DOTS ═══════════ */}
        {STATES.slice(0, -1).map((_, i) => (
          <circle 
            key={`d-${i}`} 
            className={`dot-state-${i}-${i + 1}`} 
            r={6} 
            fill="var(--accent-emerald)" 
            opacity={0} 
            filter="url(#glowGreen)" 
          />
        ))}
      </svg>
    </SlideLayout>
  );
}
