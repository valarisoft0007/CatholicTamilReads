"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Tooltip content="Back to top" position="left" wrapperClassName="fixed bottom-6 right-6 z-40 inline-flex">
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white shadow-lg transition-all hover:bg-gold-dark hover:shadow-xl"
      aria-label="Back to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
    </Tooltip>
  );
}
