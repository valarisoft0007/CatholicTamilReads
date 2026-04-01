"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const ROSARY_BEADS = [
  { angle: 0,   cx: 50,      cy: 28      },
  { angle: 36,  cx: 46.5623, cy: 38.5801 },
  { angle: 72,  cx: 37.5623, cy: 45.119  },
  { angle: 108, cx: 26.4377, cy: 45.119  },
  { angle: 144, cx: 17.4377, cy: 38.5801 },
  { angle: 180, cx: 14,      cy: 28      },
  { angle: 216, cx: 17.4377, cy: 17.4199 },
  { angle: 252, cx: 26.4377, cy: 10.881  },
  { angle: 288, cx: 37.5623, cy: 10.881  },
  { angle: 324, cx: 46.5623, cy: 17.4199 },
];

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 80"
      fill="currentColor"
      className={className}
    >
      {/* Ornate Catholic Cross */}
      <rect x="26" y="0" width="12" height="80" rx="2" />
      <rect x="8" y="20" width="48" height="12" rx="2" />
      {/* Decorative ends */}
      <circle cx="32" cy="4" r="4" />
      <circle cx="32" cy="76" r="4" />
      <circle cx="12" cy="26" r="4" />
      <circle cx="52" cy="26" r="4" />
      {/* Center jewel */}
      <circle cx="32" cy="26" r="6" opacity="0.6" />
    </svg>
  );
}

function BibleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
    >
      {/* Open book */}
      <path d="M4 12 C4 12 16 8 32 14 C48 8 60 12 60 12 L60 52 C60 52 48 48 32 54 C16 48 4 52 4 52 Z" opacity="0.3" />
      {/* Spine */}
      <line x1="32" y1="14" x2="32" y2="54" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {/* Pages left */}
      <path d="M6 14 C6 14 17 10 31 15 L31 52 C17 47 6 50 6 50 Z" opacity="0.15" />
      {/* Pages right */}
      <path d="M58 14 C58 14 47 10 33 15 L33 52 C47 47 58 50 58 50 Z" opacity="0.15" />
      {/* Cross on cover */}
      <rect x="29" y="24" width="6" height="16" rx="1" opacity="0.5" />
      <rect x="24" y="29" width="16" height="6" rx="1" opacity="0.5" />
    </svg>
  );
}

function RosaryIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
    >
      {/* Rosary ring */}
      <circle cx="32" cy="28" r="18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      {/* Beads around the circle */}
      {ROSARY_BEADS.map(({ angle, cx, cy }) => (
        <circle key={angle} cx={cx} cy={cy} r="2.5" opacity="0.5" />
      ))}
      {/* Pendant chain */}
      <line x1="32" y1="46" x2="32" y2="58" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      {/* Small cross pendant */}
      <rect x="30" y="54" width="4" height="10" rx="1" opacity="0.5" />
      <rect x="27" y="57" width="10" height="4" rx="1" opacity="0.5" />
    </svg>
  );
}

function CandleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 80"
      fill="currentColor"
      className={className}
    >
      {/* Flame */}
      <path
        d="M32 4 C28 14 22 18 22 24 C22 30 26 34 32 34 C38 34 42 30 42 24 C42 18 36 14 32 4 Z"
        opacity="0.4"
      />
      {/* Inner flame */}
      <path
        d="M32 12 C30 18 27 20 27 24 C27 27 29 30 32 30 C35 30 37 27 37 24 C37 20 34 18 32 12 Z"
        opacity="0.2"
      />
      {/* Candle body */}
      <rect x="26" y="34" width="12" height="36" rx="2" opacity="0.3" />
      {/* Candle base/holder */}
      <rect x="20" y="66" width="24" height="6" rx="2" opacity="0.4" />
      <rect x="24" y="70" width="16" height="6" rx="2" opacity="0.3" />
    </svg>
  );
}

export function HeroSection() {
  const { user } = useAuth();
  const router = useRouter();

  const handleExplore = () => {
    if (user) {
      document.getElementById("books")?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/auth/signin?redirect=/#books");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gold/8 via-gold/3 to-transparent py-12 sm:py-20">
      {/* Decorative SVG Icons */}
      <div className="mx-auto flex max-w-md items-end justify-center gap-6 sm:gap-10 mb-8">
        <CrossIcon className="h-14 w-10 sm:h-20 sm:w-14 text-gold animate-float opacity-30" />
        <BibleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gold opacity-25" />
        <RosaryIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gold opacity-25" />
        <CandleIcon className="h-14 w-10 sm:h-20 sm:w-14 text-gold opacity-30" />
      </div>

      {/* Text Content */}
      <div className="text-center px-4">
        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight sm:text-5xl">
          Catholic Reads
        </h1>
        <p className="mx-auto mb-8 max-w-md text-base text-muted sm:text-lg">
          Inspiring books, delivered chapter by chapter.
        </p>
        <button
          onClick={handleExplore}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-gold-dark hover:shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Start Exploring
        </button>

        {!user && (
          <p className="mt-3 text-xs text-muted">
            <Link href="/auth/signin" className="text-gold hover:underline">
              Create a free account
            </Link>{" "}
            to start reading
          </p>
        )}
      </div>
    </section>
  );
}
