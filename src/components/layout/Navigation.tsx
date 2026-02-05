import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function Navigation({
  current,
  total,
  onPrev,
  onNext,
  onGoTo,
  isFirst,
  isLast,
}: NavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      {/* Prev button */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-all duration-200 disabled:opacity-20"
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      {/* Slide dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "8px",
              background:
                i === current ? "var(--accent-cyan)" : "var(--text-muted)",
              opacity: i === current ? 1 : 0.5,
            }}
          />
        ))}
        <span
          className="ml-3 text-xs tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {current + 1} / {total}
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-all duration-200 disabled:opacity-20"
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
