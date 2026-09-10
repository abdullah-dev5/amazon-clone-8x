"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signinSchema, signupSchema } from "@/lib/validation/auth";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const url = mode === "signin" ? "/api/auth/signin" : "/api/auth/signup";
    const body = mode === "signin" ? { email, password } : { name, email, password };

    const localCheck = mode === "signin" ? signinSchema.safeParse(body) : signupSchema.safeParse(body);
    if (!localCheck.success) {
      const errors: Record<string, string> = {};
      for (const issue of localCheck.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="rounded-lg border border-gray-300 p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-gray-800 mb-1">Your name</label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? "auth-name-error" : undefined}
                className="w-full rounded border border-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {fieldErrors.name && (
                <p id="auth-name-error" className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-800 mb-1">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
              className="w-full rounded border border-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {fieldErrors.email && (
              <p id="auth-email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-800 mb-1">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "auth-password-error" : undefined}
              className="w-full rounded border border-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {fieldErrors.password ? (
              <p id="auth-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            ) : (
              mode === "signup" && <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-amber-400 py-1.5 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
          >
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create your account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 border-t pt-4">
          {mode === "signin" ? (
            <>
              New to amazonw?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-blue-700 hover:underline">
                Create your amazonw account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/signin?next=${encodeURIComponent(next)}`} className="text-blue-700 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
