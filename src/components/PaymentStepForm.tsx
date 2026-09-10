"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function PaymentStepForm() {
  const router = useRouter();
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/checkout/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardholderName, cardNumber, expiry, cvv }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push("/checkout/review");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="rounded-lg border border-gray-300 p-4 space-y-3">
        <p className="text-xs text-gray-500">
          This is a demo checkout. No real payment is processed and card details are
          never stored — only the last 4 digits are kept to show on your order.
        </p>
        <div>
          <label htmlFor="pay-name" className="block text-sm font-medium text-gray-800 mb-1">Name on card</label>
          <input
            id="pay-name"
            required
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="w-full rounded border border-gray-400 px-3 py-1.5"
          />
        </div>
        <div>
          <label htmlFor="pay-number" className="block text-sm font-medium text-gray-800 mb-1">Card number</label>
          <input
            id="pay-number"
            required
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="w-full rounded border border-gray-400 px-3 py-1.5"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="pay-expiry" className="block text-sm font-medium text-gray-800 mb-1">Expiry (MM/YY)</label>
            <input
              id="pay-expiry"
              required
              placeholder="12/29"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full rounded border border-gray-400 px-3 py-1.5"
            />
          </div>
          <div className="w-24">
            <label htmlFor="pay-cvv" className="block text-sm font-medium text-gray-800 mb-1">CVV</label>
            <input
              id="pay-cvv"
              required
              inputMode="numeric"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded border border-gray-400 px-3 py-1.5"
            />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-amber-400 px-5 py-1.5 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
      >
        {submitting ? "Verifying…" : "Continue to review"}
      </button>
    </form>
  );
}
