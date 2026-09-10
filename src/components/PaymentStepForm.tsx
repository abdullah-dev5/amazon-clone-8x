"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { paymentSchema, DEMO_CARD_NUMBER } from "@/lib/validation/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function PaymentStepForm() {
  const router = useRouter();
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side check with the exact same schema the server enforces —
    // catches format mistakes instantly, without a round trip, but the
    // server call below is still the authoritative check.
    const localCheck = paymentSchema.safeParse({ cardholderName, cardNumber, expiry, cvv });
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
    const res = await fetch("/api/checkout/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardholderName, cardNumber, expiry, cvv }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    router.push("/checkout/review");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <p className="font-semibold mb-0.5">This is a demo checkout — no real payment is processed.</p>
        <p>
          Use test card <span className="font-mono font-semibold">{DEMO_CARD_NUMBER}</span>, any future
          expiry date, and any 3-digit CVV. Card details are never stored — only the last 4 digits are
          kept to show on your order.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <div>
          <Label htmlFor="pay-name" className="mb-1">Name on card</Label>
          <Input
            id="pay-name"
            required
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            aria-invalid={!!fieldErrors.cardholderName}
            aria-describedby={fieldErrors.cardholderName ? "pay-name-error" : undefined}
          />
          {fieldErrors.cardholderName && (
            <p id="pay-name-error" className="mt-1 text-xs text-red-600">{fieldErrors.cardholderName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="pay-number" className="mb-1">Card number</Label>
          <Input
            id="pay-number"
            required
            inputMode="numeric"
            placeholder={DEMO_CARD_NUMBER}
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            aria-invalid={!!fieldErrors.cardNumber}
            aria-describedby={fieldErrors.cardNumber ? "pay-number-error" : undefined}
          />
          {fieldErrors.cardNumber && (
            <p id="pay-number-error" className="mt-1 text-xs text-red-600">{fieldErrors.cardNumber}</p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="pay-expiry" className="mb-1">Expiry (MM/YY)</Label>
            <Input
              id="pay-expiry"
              required
              inputMode="numeric"
              placeholder="12/29"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              aria-invalid={!!fieldErrors.expiry}
              aria-describedby={fieldErrors.expiry ? "pay-expiry-error" : undefined}
            />
            {fieldErrors.expiry && (
              <p id="pay-expiry-error" className="mt-1 text-xs text-red-600">{fieldErrors.expiry}</p>
            )}
          </div>
          <div className="w-24">
            <Label htmlFor="pay-cvv" className="mb-1">CVV</Label>
            <Input
              id="pay-cvv"
              required
              inputMode="numeric"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!fieldErrors.cvv}
              aria-describedby={fieldErrors.cvv ? "pay-cvv-error" : undefined}
            />
            {fieldErrors.cvv && (
              <p id="pay-cvv-error" className="mt-1 text-xs text-red-600">{fieldErrors.cvv}</p>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Verifying…" : "Continue to review"}
      </Button>
    </form>
  );
}
