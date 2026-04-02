"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl text-gold">&#10013;</span>
      <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        An unexpected error occurred. Please try again or return to the home page.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-gold px-5 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
