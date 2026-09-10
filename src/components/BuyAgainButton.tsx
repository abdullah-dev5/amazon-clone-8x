"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

type BuyAgainSummary = {
  added: { productTitle: string; quantity: number }[];
  unavailable: { productTitle: string; reason: string }[];
  itemCount: number;
};

export function BuyAgainButton({ orderId }: { orderId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BuyAgainSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setItemCount = useCartStore((s) => s.setItemCount);

  async function buyAgain() {
    setSubmitting(true);
    setError(null);
    setResult(null);
    const res = await fetch(`/api/orders/${orderId}/buy-again`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong adding these items to your cart.");
      setSubmitting(false);
      return;
    }
    setItemCount(data.itemCount);
    setResult(data);
    setSubmitting(false);
  }

  return (
    <div className="space-y-1.5">
      <Button type="button" variant="outline" size="sm" onClick={buyAgain} disabled={submitting}>
        {submitting ? "Adding…" : "Buy it again"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {result && (
        <div className="text-xs space-y-0.5">
          {result.added.length > 0 && (
            <p className="text-green-700">
              Added {result.added.map((i) => `${i.productTitle} (×${i.quantity})`).join(", ")} to your{" "}
              <Link href="/cart" className="underline">
                cart
              </Link>
              .
            </p>
          )}
          {result.unavailable.length > 0 && (
            <p className="text-amber-700">
              Couldn&apos;t add {result.unavailable.map((i) => `${i.productTitle} (${i.reason})`).join(", ")}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
