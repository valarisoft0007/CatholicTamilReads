"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addFavorite, removeFavorite, isFavorited } from "@/lib/firestore/bookmarks";
import { Tooltip } from "@/components/ui/Tooltip";

interface FavoriteButtonProps {
  bookId: string;
  bookTitle: string;
  coverImageUrl?: string;
}

export function FavoriteButton({ bookId, bookTitle, coverImageUrl }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    isFavorited(user.uid, bookId).then(setFavorited);
  }, [user, bookId]);

  if (!user) return null;

  const handleToggle = async () => {
    const next = !favorited;
    setFavorited(next);
    setLoading(true);
    try {
      if (next) {
        await addFavorite(user.uid, { bookId, bookTitle, coverImageUrl: coverImageUrl ?? "" });
      } else {
        await removeFavorite(user.uid, bookId);
      }
    } catch (err) {
      setFavorited(!next);
      console.error("Favorite toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip content={favorited ? "Remove from favorites" : "Add to favorites"}>
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
          favorited
            ? "border-gold bg-gold/10 text-gold-dark"
            : "border-border text-muted hover:border-gold/30 hover:text-gold-dark"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={favorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {favorited ? "Favorited" : "Favorite"}
      </button>
    </Tooltip>
  );
}
