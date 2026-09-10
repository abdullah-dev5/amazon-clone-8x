"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const url = mode === "signin" ? "/api/auth/signin" : "/api/auth/signup";
    const body = mode === "signin" ? { email, password } : { name, email, password };

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
              <label className="block text-sm font-medium text-gray-800 mb-1">Your name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-400 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

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
