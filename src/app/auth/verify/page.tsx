"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { Suspense } from "react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const destination = redirectParam?.startsWith("/") ? redirectParam : "/";

  const [status, setStatus] = useState<"verifying" | "need-email" | "error" | "done">("verifying");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const completeSignIn = async (emailToUse: string) => {
    const auth = getClientAuth();
    const result = await signInWithEmailLink(auth, emailToUse, window.location.href);
    const u = result.user;
    const ref = doc(getClientDb(), "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email,
        createdAt: serverTimestamp(),
      });
    }
    localStorage.removeItem("emailForSignIn");
    setStatus("done");
    router.push(destination);
  };

  useEffect(() => {
    const auth = getClientAuth();
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStatus("error");
      setError("This link is invalid or has expired.");
      return;
    }

    const savedEmail = localStorage.getItem("emailForSignIn");
    if (savedEmail) {
      completeSignIn(savedEmail).catch(() => {
        setStatus("error");
        setError("Sign-in failed. The link may have expired. Please request a new one.");
      });
    } else {
      setStatus("need-email");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeSignIn(email);
    } catch {
      setError("Sign-in failed. The link may have expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "verifying" || status === "done") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-3xl text-gold">&#10013;</div>
          <p className="text-sm text-muted">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (status === "need-email") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="text-3xl text-gold sm:text-4xl">&#10013;</span>
            <h1 className="mt-4 text-xl font-bold">Confirm your email</h1>
            <p className="mt-1 text-sm text-muted">
              Please enter the email address you used to request the sign-in link.
            </p>
          </div>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Confirm & Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 text-3xl text-gold">&#10013;</div>
        <p className="text-sm text-danger">{error}</p>
        <a href="/auth/signin" className="mt-4 inline-block text-sm text-gold hover:underline">
          Back to Sign In
        </a>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-3xl text-gold">&#10013;</div>
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
