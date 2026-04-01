import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl text-gold sm:text-4xl">&#10013;</span>
          <h1 className="mt-4 text-xl font-bold sm:text-2xl">Get Started</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in or create an account to start reading.
          </p>
        </div>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
