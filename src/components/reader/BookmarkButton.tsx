"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
} from "@/lib/firestore/bookmarks";

interface BookmarkButtonProps {
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
}

export function BookmarkButton({
  bookId,
  chapterId,
  bookTitle,
  chapterTitle,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    isBookmarked(user.uid, bookId, chapterId).then(setBookmarked);
  }, [user, bookId, chapterId]);

  if (!user) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (bookmarked) {
        await removeBookmark(user.uid, bookId, chapterId);
        setBookmarked(false);
      } else {
        await addBookmark(user.uid, { bookId, chapterId, bookTitle, chapterTitle });
        setBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
        bookmarked
          ? "border-gold bg-gold/10 text-gold-dark"
          : "border-border text-muted hover:border-gold/30 hover:text-gold-dark"
      }`}
      title={bookmarked ? "Remove bookmark" : "Bookmark this chapter"}
    >
      {bookmarked ? "&#9733; Bookmarked" : "&#9734; Bookmark"}
    </button>
  );
}
