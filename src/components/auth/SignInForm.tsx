"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendSignInLinkToEmail } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";

export function SignInForm() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const destination = redirectParam?.startsWith("/") ? redirectParam : "/";

  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push(destination);
    } catch {
      setGoogleError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);
    try {
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(getClientAuth(), email, actionCodeSettings);
      localStorage.setItem("emailForSignIn", email);
      setLinkSent(true);
    } catch {
      setEmailError("Failed to send link. Please check the email and try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  if (linkSent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mb-3 text-3xl text-gold">&#9993;</div>
        <h2 className="mb-2 font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
          Click the link in the email to sign in.
        </p>
        <button
          onClick={() => { setLinkSent(false); setEmail(""); }}
          className="mt-4 text-xs text-gold hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Sign-In */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-card-hover disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {googleLoading ? "Signing in..." : "Continue with Google"}
      </button>

      {googleError && <p className="text-sm text-danger">{googleError}</p>}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email Magic Link */}
      <form onSubmit={handleEmailLink} className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            required
          />
        </div>

        {emailError && <p className="text-sm text-danger">{emailError}</p>}

        <button
          type="submit"
          disabled={emailLoading}
          className="w-full rounded-md bg-gold py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          {emailLoading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>
    </div>
  );
}
