import type { ComponentType } from "react";
import { EngineFlowSlide } from "@/components/slides/EngineFlowSlide";
import { HorizontalScalingSlide } from "@/components/slides/HorizontalScalingSlide";
import { TradingTerminalSlide } from "@/components/slides/TradingTerminalSlide";
import { TraditionalBacktestSlide } from "@/components/slides/TraditionalBacktestSlide";
import { CodeReuseSlide } from "@/components/slides/CodeReuseSlide";
import { LLMFlowSlide } from "@/components/slides/LLMFlowSlide";
import { OrderReplicationSlide } from "@/components/slides/OrderReplicationSlide";
import { RiskManagementSlide } from "@/components/slides/RiskManagementSlide";
import { BrokerAgnosticSlide } from "@/components/slides/BrokerAgnosticSlide";
import { ObservabilitySlide } from "@/components/slides/ObservabilitySlide";
import { StrategyLifecycleSlide } from "@/components/slides/StrategyLifecycleSlide";
import { BacktestingFlowSlide } from "@/components/slides/BacktestingFlowSlide";

export type SlideDefinition = {
  id: string;
  Component: ComponentType<{ active: boolean }>;
};

export const MAIN_SLIDES: SlideDefinition[] = [
  { id: "engine-flow", Component: EngineFlowSlide },
  { id: "llm-flow", Component: LLMFlowSlide },
  { id: "traditional-backtest", Component: TraditionalBacktestSlide },
  { id: "code-reuse", Component: CodeReuseSlide },
  { id: "backtesting-flow", Component: BacktestingFlowSlide },
  { id: "trading-terminal", Component: TradingTerminalSlide },
];

export const BACKUP_SLIDES: SlideDefinition[] = [
  { id: "horizontal-scaling", Component: HorizontalScalingSlide },
  { id: "order-replication", Component: OrderReplicationSlide },
  { id: "risk-management", Component: RiskManagementSlide },
  { id: "broker-agnostic", Component: BrokerAgnosticSlide },
  { id: "observability", Component: ObservabilitySlide },
  { id: "strategy-lifecycle", Component: StrategyLifecycleSlide },
];
