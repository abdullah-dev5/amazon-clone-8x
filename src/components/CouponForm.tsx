"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { couponCodeSchema } from "@/lib/validation/coupon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CouponForm({
  appliedCode,
  invalidNotice,
}: {
  appliedCode: string | null;
  invalidNotice: string | null;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const localCheck = couponCodeSchema.safeParse(code);
    if (!localCheck.success) {
      setError(localCheck.error.issues[0]?.message ?? "Enter a valid coupon code.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/checkout/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong applying that code.");
      setSubmitting(false);
      return;
    }
    // The server (not this component) owns the total — re-render the page
    // from fresh data rather than computing a second copy of the discount.
    setCode("");
    router.refresh();
    setSubmitting(false);
  }

  async function remove() {
    setSubmitting(true);
    setError(null);
    await fetch("/api/checkout/coupon", { method: "DELETE" });
    router.refresh();
    setSubmitting(false);
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-700">
          Coupon <span className="font-semibold">{appliedCode}</span> applied
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={submitting}
          className="text-blue-700 hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      {invalidNotice && (
        <p role="alert" className="text-xs text-amber-700 mb-1.5">
          {invalidNotice}
        </p>
      )}
      <form onSubmit={apply} className="flex gap-2">
        <Label htmlFor="coupon-code" className="sr-only">
          Coupon code
        </Label>
        <Input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter a coupon code"
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={submitting || !code.trim()} className="shrink-0">
          {submitting ? "Applying…" : "Apply"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
