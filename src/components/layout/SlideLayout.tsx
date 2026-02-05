import type { ReactNode } from "react";

interface SlideLayoutProps {
  children: ReactNode;
  className?: string;
}

export function SlideLayout({ children, className = "" }: SlideLayoutProps) {
  return (
    <div className={`slide ${className}`}>
      {children}
    </div>
  );
}
