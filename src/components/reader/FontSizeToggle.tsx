"use client";

import { useEffect, useState } from "react";

// const SIZES = [
//   { label: "S", value: "0.95rem" },
//   { label: "M", value: "1.1rem" },
//   { label: "L", value: "1.25rem" },
// ] as const;

const SIZES = [
  { label: "S", value: "0.9rem" },
  { label: "M", value: "1.0rem" },
  { label: "L", value: "1.2rem" },
] as const;

const STORAGE_KEY = "reader-font-size";

export function FontSizeToggle() {
  const [active, setActive] = useState(1); // default M

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const idx = SIZES.findIndex((s) => s.value === saved);
      if (idx !== -1) setActive(idx);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--reader-font-size",
      SIZES[active].value
    );
    localStorage.setItem(STORAGE_KEY, SIZES[active].value);
  }, [active]);

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
      {SIZES.map((size, i) => (
        <button
          key={size.label}
          onClick={() => setActive(i)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            active === i
              ? "bg-gold text-white"
              : "text-muted hover:text-foreground"
          }`}
          aria-label={`Font size ${size.label}`}
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
