interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1" style={{ background: "var(--bg-secondary)" }}>
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))`,
        }}
      />
    </div>
  );
}
