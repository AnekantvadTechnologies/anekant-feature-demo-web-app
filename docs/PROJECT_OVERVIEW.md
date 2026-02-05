# Engine Demo Web App — Project Overview

## 1. Intent of the Project

This project is a **standalone interactive presentation** that visually demonstrates how the Anekant trading engine processes market data, from the moment a tick leaves the exchange to the point an order is placed with a broker.

The goal is not to document code or APIs, but to **tell the story of the system** using animated SVG diagrams. The target audience is anyone who needs a high-level, visual understanding of:

- How the Anekant engine's event-driven, async architecture processes every tick in parallel — and why that matters compared to traditional sequential setups.
- How AI/LLM-driven strategies plug into the same engine, with the AI Agent running on a slower cycle alongside the fast tick-processing loop.
- How backtesting replays historical market data through the exact same engine and strategy code, producing results that faithfully mirror live trading conditions.

The presentation is intentionally **high-level**. It avoids internal method names, registry details, or code-level specifics. It focuses on data flow, parallelism, and architecture.

---

## 2. Data Sources — Where We Gathered Information

The diagrams and animation designs are grounded in actual system architecture. The following source repositories and files were studied to build accurate representations:

### Anekant Engine (core trading engine)

**Repository**: `/Users/parasdoshi/Code/anekant-engine`

| Area | Key files/directories studied |
|------|-------------------------------|
| Event-driven dispatcher | `core/dispatcher.py` — `RealtimeDispatcher` (async) vs `BacktestingDispatcher` (chronological) |
| Tick processing & multiplexing | `core/multiplexer.py` — how incoming ticks fan out to candle builders, indicators, metrics, and strategy |
| State machine & strategy lifecycle | `core/state_machine/` — INITIALIZE → START → CREATE → MANAGE → END |
| Order Management System (OMS) | `core/oms/broker_oms.py` — `BrokerOMS` abstraction, `KiteBrokerOMS`, `XtsBrokerOMS` |
| Position management | `core/position_manager.py`, `strategies/` — how strategies generate orders, how fills flow back |
| Backtesting wrapper | `core/backtesting/wrapper.py` — `BacktestingWrapper` replaying date ranges from SQLite |
| Replay OMS | `core/oms/` — `ReplayOMS` simulating broker behavior with slippage |
| Metrics & observability | `metrics/` — `MetricsCoordinator`, SQLite storage, memory/db/dual modes |
| Strategy patterns | `strategies/` — SimpleWOP, Strangle, etc. (studied for lifecycle, not specific logic) |
| Architecture docs | `docs/CORE_ARCHITECTURE.md`, `docs/SYSTEM_ARCHITECTURE.md` |
| Backtesting data source | `apps/backtesting/` — `KiteLocalDBTickerProvider` reading compressed `.db.zst` from S3 |

### Anekant AI Agent (LLM integration)

**Repository**: `/Users/parasdoshi/Code/anekant-ai-agent`

| Area | Key files studied |
|------|-------------------|
| AI Agent architecture & plan | `docs/AI_AGENT_PLAN.md` — cycle timing (~30-60s), metrics fetching, chart generation, prompt building, structured LLM responses, command dispatch back to engine via Redis |

### Anekant AI SDK (LLM provider abstraction)

**Repository**: `/Users/parasdoshi/Code/anekant-ai-sdk`

| Area | Key files studied |
|------|-------------------|
| Provider architecture | `anekant_ai_sdk/providers/` — Dummy, Google Gemini, Anthropic Claude adapters |
| Response models | `anekant_ai_sdk/response_models.py` — structured output schemas |
| Shared contracts | `anekant_ai_sdk/contracts/` — `TargetPosition`, `MarketDirection`, position models |

### Anekant Metrics FastAPI (metrics sidecar)

**Repository**: `/Users/parasdoshi/Code/anekant-metrics-fastapi`

| Area | Key files studied |
|------|-------------------|
| REST API for metrics | `server/api/` — how the AI Agent fetches aggregated metrics and charts from the running engine |
| SQLite read-only access | `server/repositories/` — parameterized SQL, read-only DB access pattern |

### Engine Commands API (command center)

**Repository**: `/Users/parasdoshi/Code/engine-commands-api`

| Area | Key files studied |
|------|-------------------|
| Redis streams architecture | `app/services/` — stream naming (`targeted_command:{id}`, `command_response:{id}`, etc.) |
| Command dispatch flow | `app/api/v1/` — how commands flow from web/API → Redis → engine |

### Engine Launcher (infrastructure)

**Repository**: `/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-and-infrastructure`

| Area | Key files studied |
|------|-------------------|
| ECS deployment model | `compute_backend/` — how multiple engines run as ECS tasks |
| Multi-app support | `config_models/client_app_config.py` — per-client app configuration |
| Metrics sidecar integration | `infra/stacks/ecr/metrics_fastapi_stack.py` — sidecar container setup |

---

## 3. What We've Landed On — Current State

The presentation consists of **3 slides**, each a full-screen animated SVG diagram built with React + GSAP:

### Slide 1: "How a Tick Reaches Your Strategy" (`EngineFlowSlide.tsx`)

**Layout**: Two-row comparison.

- **Top row (red accents)**: Traditional setup — a sequential pipeline (Exchange → Poll Data → Rebuild Candles → Recompute Indicators → Evaluate Strategy). A single slow-moving dot crawls through each step with "wait…" labels between them. Missed-tick X marks and a tick pile-up indicator on the left show ticks arriving while the pipeline is still processing. A "~5s per cycle" label emphasizes the slowness.

- **Bottom row (cyan/green accents)**: Anekant engine — Exchange → Redis Streams → 3 parallel Engine boxes. Each engine box is enlarged to show internal parallel processing: Candles, Indicators, Metrics, and Strategy all updating simultaneously (visualized by dots fanning out in parallel). After internal processing, orders flow out to a Broker node (purple dots, "Orders" label), and fill confirmations flow back from the Broker into the engines (green dots on dashed return paths, "Fills" label). This forms a complete feedback loop.

- **Contrast labels** near the divider: "1 tick at a time" (traditional) vs "All ticks, all engines, in parallel" (Anekant).

### Slide 2: "AI-Driven Strategy with LLM" (`LLMFlowSlide.tsx`)

**Layout**: Full-screen single diagram (no traditional comparison).

- **Fast inner loop (cyan, every tick)**: Exchange → Redis Streams → single Engine (with internal Candles/Indicators/Metrics/Strategy fan-out) → Broker → Fills back. Also: Engine continuously writes to Metrics DB (SQLite).

- **Slow outer loop (purple, ~30-60s)**: Metrics DB → Metrics API (FastAPI sidecar) → AI Agent (large box with sub-items: "Fetch Metrics", "Generate Charts", "Build Prompt" — these highlight sequentially during the animation) → LLM cloud (Gemini/Claude, with a "thinking" pulse) → structured response back to Agent → Agent sends commands back to Redis Streams → Engine receives and executes position convergence.

- **Two speed callouts**: "Every tick" badge near the engine loop, "~30-60s cycle" badge near the agent loop.

### Slide 3: "Replay the Markets, Tick by Tick" (`BacktestingFlowSlide.tsx`)

**Layout**: Full-screen single diagram (no traditional comparison).

- **Data source swap**: Instead of Exchange + Redis, the left side shows S3 (Historical Data) → SQLite DB (.db.zst archives) → Backtesting Dispatcher (chronological replay).

- **Same engine**: The centre engine box is identical to the live slides, with a "Same engine code" badge and "Same strategy code" badge inside. A simulated-time clock overlay shows time advancing through trading hours (09:15 → 15:30).

- **Replay OMS**: Instead of a real Broker, orders go to "Replay OMS" (with "slippage simulation" subtitle). Simulated fills flow back.

- **Ghosted LLM path**: A dimmed/ghosted AI Agent + LLM path shows that the LLM can plug into backtesting the same way as live, with the label "Optional: plug in LLM the same way as live."

- **Fast-forward feel**: Animation dots move faster (~2-3x live speed), with a "▶▶ Fast replay" indicator in the corner.

### Shared Infrastructure

- `src/components/slides/shared/` — Reusable SVG components (`EngineBox`, `DotGrid`, `GlowFilter`, `StandardDefs`) and utilities (`animateDot`, `animateDotReverse`, `bezierH`, layout constants).
- `src/components/layout/` — `SlideLayout`, `ProgressBar`, `Navigation`, `ThemeToggle`.
- `src/hooks/` — `useTheme` (dark/light with localStorage), `useSlideNavigation` (keyboard arrows, home/end), `useGsapTimeline`.
- Theme support via CSS custom properties in `src/index.css` — full dark and light modes.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 (CSS-first, `@tailwindcss/vite` plugin) |
| Diagrams | SVG (hand-authored), rendered inside React components |
| Animation (data flow) | GSAP 3 — timelines, dot-along-path, staggered reveals, continuous loops |
| Animation (slide transitions) | Framer Motion — spring-based page transitions with `AnimatePresence` |
| Navigation | Keyboard (arrows, space, home/end) + click navigation |

---

## 4. Future Changes — Reference Guide

When extending or modifying this presentation, you'll need to reference the actual system architecture to keep diagrams accurate.

### Where to look for each topic

#### Tick processing, candle building, indicator updates

```
/Users/parasdoshi/Code/anekant-engine/core/dispatcher.py
/Users/parasdoshi/Code/anekant-engine/core/multiplexer.py
/Users/parasdoshi/Code/anekant-engine/indicators/
/Users/parasdoshi/Code/anekant-engine/ticks/
```

#### Strategy lifecycle (state machine, create/manage states)

```
/Users/parasdoshi/Code/anekant-engine/core/state_machine/
/Users/parasdoshi/Code/anekant-engine/strategies/
/Users/parasdoshi/Code/anekant-engine/docs/strategy_development_guide.md
```

#### Order management, broker integration, position management

```
/Users/parasdoshi/Code/anekant-engine/core/oms/broker_oms.py
/Users/parasdoshi/Code/anekant-engine/core/position_manager.py
/Users/parasdoshi/Code/anekant-engine/brokers/
```

#### Metrics system (what gets stored, how it's accessed)

```
/Users/parasdoshi/Code/anekant-engine/metrics/
/Users/parasdoshi/Code/anekant-metrics-fastapi/server/
```

#### AI Agent architecture (cycle timing, prompt building, LLM calls)

```
/Users/parasdoshi/Code/anekant-ai-agent/docs/AI_AGENT_PLAN.md
/Users/parasdoshi/Code/anekant-ai-agent/anekant_ai_agent/
```

#### AI SDK (provider adapters, response models, shared contracts)

```
/Users/parasdoshi/Code/anekant-ai-sdk/anekant_ai_sdk/providers/
/Users/parasdoshi/Code/anekant-ai-sdk/anekant_ai_sdk/contracts/
/Users/parasdoshi/Code/anekant-ai-sdk/anekant_ai_sdk/response_models.py
```

#### Redis streams, command dispatch, command center

```
/Users/parasdoshi/Code/engine-commands-api/app/services/
/Users/parasdoshi/Code/engine-commands-api/app/schemas/
/Users/parasdoshi/Code/engine-commands-api/references/
```

#### Backtesting architecture (data sources, dispatcher, replay OMS)

```
/Users/parasdoshi/Code/anekant-engine/core/backtesting/wrapper.py
/Users/parasdoshi/Code/anekant-engine/apps/backtesting/
/Users/parasdoshi/Code/anekant-engine/core/oms/  (ReplayOMS)
```

#### Infrastructure (ECS, multi-engine deployment, sidecar containers)

```
/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-and-infrastructure/compute_backend/
/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-and-infrastructure/config_models/
/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-and-infrastructure/infra/
```

#### Client configurations (which clients/apps are deployed)

```
/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-configs/clients/
```

#### Command center web app (the web UI that controls strategies)

```
/Users/parasdoshi/Code/command-center-web-app/src/
```

### Repository Absolute Paths (Quick Reference)

| Repository | Absolute Path |
|-----------|---------------|
| **Anekant Engine** | `/Users/parasdoshi/Code/anekant-engine` |
| **Anekant AI Agent** | `/Users/parasdoshi/Code/anekant-ai-agent` |
| **Anekant AI SDK** | `/Users/parasdoshi/Code/anekant-ai-sdk` |
| **Anekant Metrics FastAPI** | `/Users/parasdoshi/Code/anekant-metrics-fastapi` |
| **Engine Commands API** | `/Users/parasdoshi/Code/engine-commands-api` |
| **Engine Launcher & Infra** | `/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-and-infrastructure` |
| **Engine Launcher Configs** | `/Users/parasdoshi/Code/engine-launcher-related/engine-launcher-configs` |
| **Command Center Web App** | `/Users/parasdoshi/Code/command-center-web-app` |
| **This project (Demo)** | `/Users/parasdoshi/Code/engine-demo-web-app` |

---

## 5. Design Intent & Rationale

### Why a standalone web app?

The demo needed to be shareable, interactive, and visually compelling. A standalone React app with no backend dependencies means it can be built as a static site and shared with anyone. It runs entirely in the browser with no API keys, no Redis, and no engine instance needed.

### Why SVG + GSAP (not Canvas or pure CSS)?

- **SVG** gives us named, styleable, inspectable elements — each box, path, and dot is a DOM node that can be targeted by CSS variables for theming and by GSAP for animation.
- **GSAP** provides frame-accurate timeline control, which is essential for choreographing parallel data-flow animations where the speed contrast between traditional (slow) and Anekant (fast) processing must be visually obvious. GSAP's `getPointAtLength` integration lets dots follow curved bezier paths precisely.
- **Framer Motion** handles slide transitions (spring-based enter/exit) while GSAP handles the in-slide data-flow animations. This separation keeps concerns clean.

### Why the two-row comparison on Slide 1?

The most immediate "aha moment" for the audience is seeing the traditional sequential pipeline (one tick at a time, rebuilding everything, missing ticks) side-by-side with the Anekant parallel architecture (all ticks, all engines, simultaneously). The top row intentionally looks slow and broken; the bottom row looks fast and elegant. The speed contrast in the dot animations reinforces this viscerally.

### Why separate slides for LLM and Backtesting (not combined)?

Each concept has enough visual complexity to warrant its own full-screen diagram:
- The LLM slide needs to show two independent animation loops at different speeds, which would be confusing if combined with backtesting's time-simulation.
- The backtesting slide needs to show data source substitution (S3/SQLite replacing Exchange/Redis) and simulated time, which is a distinct concept from LLM integration.
- The ghosted LLM path on the backtesting slide ties them together without duplicating the full LLM diagram.

### Why no traditional comparison on Slides 2 and 3?

Slide 1 establishes the traditional vs. Anekant contrast. Once that point is made, repeating it on every slide would be redundant. Slides 2 and 3 build on the established Anekant foundation to show progressively more sophisticated capabilities (LLM integration, historical replay).

### Animation design principles

- **Speed contrast**: Traditional dots crawl (0.7s per step + 0.5s pauses). Anekant dots zip (0.3-0.5s across the whole pipeline).
- **Parallel vs sequential**: Traditional has one dot. Anekant has 3+ dots moving simultaneously across engines and internal items.
- **Color coding**: Cyan = tick data flow, Green = internal processing + fills, Purple = orders + LLM/agent paths, Red = traditional/slow, Orange = external systems (Exchange, Broker, S3).
- **Continuous loops**: Animations repeat indefinitely so the presenter can talk over them without worrying about timing.
- **Reveal-then-loop**: Elements first appear via a staggered reveal animation (boxes scale in, paths draw on), then the continuous dot-flow loop begins. This gives the audience a moment to absorb the layout before the animation starts.
