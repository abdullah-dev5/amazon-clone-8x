"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AddressOption = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export function AddressStepForm({
  addresses,
  selectedId,
}: {
  addresses: AddressOption[];
  selectedId?: string;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<string>(
    selectedId ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new"
  );
  const [showNewForm, setShowNewForm] = useState(addresses.length === 0);
  const [form, setForm] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitExisting() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/checkout/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: choice }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push("/checkout/delivery");
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/checkout/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push("/checkout/delivery");
  }

  return (
    <div className="max-w-2xl space-y-4">
      {addresses.length > 0 && !showNewForm && (
        <div className="rounded-lg border border-gray-300 divide-y">
          {addresses.map((a) => (
            <label key={a.id} className="flex items-start gap-3 p-4 cursor-pointer">
              <input
                type="radio"
                name="address"
                checked={choice === a.id}
                onChange={() => setChoice(a.id)}
                className="mt-1"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {a.fullName} {a.isDefault && <span className="text-xs text-gray-500">(Default)</span>}
                </p>
                <p className="text-gray-700">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </p>
                <p className="text-gray-700">
                  {a.city}, {a.state} {a.postalCode}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      {addresses.length > 0 && !showNewForm && (
        <button
          onClick={() => setShowNewForm(true)}
          className="text-blue-700 hover:underline text-sm"
        >
          + Add a new address
        </button>
      )}

      {showNewForm && (
        <form onSubmit={submitNew} className="rounded-lg border border-gray-300 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              aria-label="Full name"
              placeholder="Full name"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5 sm:col-span-2"
            />
            <input
              aria-label="Address line 1"
              placeholder="Address line 1"
              required
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5 sm:col-span-2"
            />
            <input
              aria-label="Address line 2 (optional)"
              placeholder="Address line 2 (optional)"
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5 sm:col-span-2"
            />
            <input
              aria-label="City"
              placeholder="City"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5"
            />
            <input
              aria-label="State"
              placeholder="State"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5"
            />
            <input
              aria-label="ZIP code"
              placeholder="ZIP code"
              required
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5"
            />
            <input
              aria-label="Phone (optional)"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded border border-gray-400 px-3 py-1.5"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-amber-400 px-5 py-1.5 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
            >
              Use this address
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="text-blue-700 hover:underline text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!showNewForm && addresses.length > 0 && (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submitExisting}
            disabled={submitting}
            className="rounded-full bg-amber-400 px-5 py-1.5 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
          >
            Deliver to this address
          </button>
        </>
      )}
    </div>
  );
}
