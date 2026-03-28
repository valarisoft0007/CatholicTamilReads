"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";

export function SignUpForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        getClientAuth(),
        email,
        password
      );

      await updateProfile(credential.user, { displayName });

      // Create user document in Firestore
      await setDoc(doc(getClientDb(), "users", credential.user.uid), {
        uid: credential.user.uid,
        email,
        displayName,
        createdAt: serverTimestamp(),
      });

      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign up failed";
      if (message.includes("email-already-in-use")) {
        setError("This email is already registered.");
      } else if (message.includes("weak-password")) {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Display Name
        </label>
        <input
          id="name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          minLength={6}
          required
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gold py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-gold hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}
