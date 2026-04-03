"use client";

import { useEffect, useState } from "react";
import { getNewsItems } from "@/lib/firestore/news";
import type { NewsItem } from "@/types";

export function NewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNewsItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return null;
  }

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
        <span className="text-gold">&#10013;</span>
        News
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
            <p className="text-sm font-semibold leading-snug">{item.title}</p>
            <p className="text-xs text-muted leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
