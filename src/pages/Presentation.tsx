import { AnimatePresence, motion } from "framer-motion";
import { useSlideNavigation } from "@/hooks/useSlideNavigation";
import { useTheme } from "@/hooks/useTheme";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Navigation } from "@/components/layout/Navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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

const SLIDES = [
  { id: "engine-flow", Component: EngineFlowSlide },
  { id: "horizontal-scaling", Component: HorizontalScalingSlide },
  { id: "trading-terminal", Component: TradingTerminalSlide },
  { id: "llm-flow", Component: LLMFlowSlide },
  { id: "order-replication", Component: OrderReplicationSlide },
  { id: "risk-management", Component: RiskManagementSlide },
  { id: "broker-agnostic", Component: BrokerAgnosticSlide },
  { id: "observability", Component: ObservabilitySlide },
  { id: "strategy-lifecycle", Component: StrategyLifecycleSlide },
  { id: "code-reuse", Component: CodeReuseSlide },
  { id: "traditional-backtest", Component: TraditionalBacktestSlide },
  { id: "backtesting-flow", Component: BacktestingFlowSlide },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function Presentation() {
  const { theme, toggleTheme } = useTheme();
  const nav = useSlideNavigation({ totalSlides: SLIDES.length });

  const currentSlideData = SLIDES[nav.currentSlide];

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <ProgressBar current={nav.currentSlide} total={nav.totalSlides} />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <AnimatePresence mode="wait" custom={nav.direction}>
        <motion.div
          key={currentSlideData.id}
          custom={nav.direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          <currentSlideData.Component active={true} />
        </motion.div>
      </AnimatePresence>

      <Navigation
        current={nav.currentSlide}
        total={nav.totalSlides}
        onPrev={nav.prevSlide}
        onNext={nav.nextSlide}
        onGoTo={nav.goToSlide}
        isFirst={nav.isFirst}
        isLast={nav.isLast}
      />
    </div>
  );
}
