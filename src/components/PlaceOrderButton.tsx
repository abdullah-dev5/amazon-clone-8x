"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button onClick={placeOrder} disabled={submitting} className="w-full">
        {submitting ? "Placing your order…" : "Place your order"}
      </Button>
    </div>
  );
}
