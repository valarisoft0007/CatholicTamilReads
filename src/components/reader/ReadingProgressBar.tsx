"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { saveProgress } from "@/lib/firestore/reading-progress";

interface ReadingProgressBarProps {
  bookId: string;
  chapterId: string;
  chapterOrder: number;
}

export function ReadingProgressBar({
  bookId,
  chapterId,
  chapterOrder,
}: ReadingProgressBarProps) {
  const { user } = useAuth();
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const lastSaved = useRef(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    setScrollPercent(percent);
  }, []);

  // Save progress debounced
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (scrollPercent !== lastSaved.current && scrollPercent > 0) {
        lastSaved.current = scrollPercent;
        saveProgress(user.uid, {
          bookId,
          lastChapterId: chapterId,
          lastChapterOrder: chapterOrder,
          scrollPosition: scrollPercent,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, bookId, chapterId, chapterOrder, scrollPercent]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      className="fixed left-0 top-0 z-50 h-1 w-full bg-border/50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-all duration-150"
        style={{ width: `${scrollPercent}%` }}
      />
      {showTooltip && scrollPercent > 0 && (
        <span
          className="absolute top-2 rounded bg-foreground/90 px-2 py-0.5 text-xs text-background"
          style={{ left: `${Math.min(scrollPercent, 95)}%` }}
        >
          {scrollPercent}%
        </span>
      )}
    </div>
  );
}
