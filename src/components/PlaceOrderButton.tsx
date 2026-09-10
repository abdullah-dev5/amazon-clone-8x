"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PlaceOrderButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function placeOrder() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/checkout/place-order", { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong placing your order.");
      setSubmitting(false);
      return;
    }
    router.push(`/checkout/confirmation/${data.orderId}`);
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={placeOrder}
        disabled={submitting}
        className="w-full rounded-full bg-amber-400 py-2 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
      >
        {submitting ? "Placing your order…" : "Place your order"}
      </button>
    </div>
  );
}
