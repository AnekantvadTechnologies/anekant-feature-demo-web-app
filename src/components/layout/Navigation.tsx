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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
      {/* Prev button */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-all duration-200 disabled:opacity-20 hover:border-[var(--accent-amber)]"
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <ChevronLeft size={18} />
        Prev
      </button>

      {/* Slide dots */}
      <div className="flex items-center gap-2.5">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className="h-2.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? "30px" : "10px",
              background:
                i === current ? "var(--accent-amber)" : "var(--text-muted)",
              opacity: i === current ? 1 : 0.5,
            }}
          />
        ))}
        <span
          className="ml-4 text-sm tabular-nums font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {current + 1} / {total}
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-all duration-200 disabled:opacity-20 hover:border-[var(--accent-amber)]"
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
