"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { DeliveryOption } from "@/lib/checkout";

export function DeliveryStepForm({
  options,
  selectedId,
}: {
  options: DeliveryOption[];
  selectedId?: string;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState(selectedId ?? options[0]?.id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/checkout/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryOptionId: choice }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push("/checkout/payment");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border border-gray-300 divide-y">
        {options.map((o) => (
          <label key={o.id} className="flex items-start justify-between gap-3 p-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="delivery"
                checked={choice === o.id}
                onChange={() => setChoice(o.id)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900">{o.label}</p>
                <p className="text-sm text-gray-600">{o.etaLabel}</p>
              </div>
            </div>
            <p className="font-medium text-gray-900">
              {o.priceCents === 0 ? "FREE" : formatPrice(o.priceCents)}
            </p>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="rounded-full bg-amber-400 px-5 py-1.5 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
      >
        Continue to payment
      </button>
    </div>
  );
}
