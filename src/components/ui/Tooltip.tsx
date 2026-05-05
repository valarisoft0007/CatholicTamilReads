"use client";

import { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  wrapperClassName?: string;
}

export function Tooltip({ content, children, position = "top", wrapperClassName }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses: Record<NonNullable<TooltipProps["position"]>, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<NonNullable<TooltipProps["position"]>, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[var(--foreground)] border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[var(--foreground)] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[var(--foreground)] border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[var(--foreground)] border-y-transparent border-l-transparent",
  };

  return (
    <span
      className={wrapperClassName ?? "relative inline-flex items-center"}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded px-2 py-1 text-xs font-sans bg-foreground text-background shadow-md pointer-events-none ${positionClasses[position]}`}
        >
          {content}
          <span
            aria-hidden="true"
            className={`absolute border-4 ${arrowClasses[position]}`}
          />
        </span>
      )}
    </span>
  );
}
