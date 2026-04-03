"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 80 && y > lastScroll.current);
      setScrolled(y > 10);
      lastScroll.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled
          ? "border-border/50 bg-background/80 backdrop-blur-md shadow-sm"
          : "border-border bg-background"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-gold text-base sm:text-xl">&#10013;</span>
          <span className="text-base font-semibold tracking-tight sm:text-xl">
            Catholic Tamil Reads
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 sm:flex">
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Home
          </Link>

          {!loading && user && (
            <Link
              href="/profile"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              My Library
            </Link>
          )}

          <ThemeToggle />

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={signOut}
                    className="rounded-lg bg-card px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-card transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Home
            </Link>

            {!loading && user && (
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                My Library
              </Link>
            )}

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted">
                      {user.displayName || user.email}
                    </span>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="rounded-lg bg-card px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-gold px-4 py-2 text-center text-sm font-medium text-white hover:bg-gold-dark transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
