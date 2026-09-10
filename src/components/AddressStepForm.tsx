"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addressSchema } from "@/lib/validation/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    setError(null);

    const localCheck = addressSchema.safeParse(form);
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
        <div className="rounded-lg border border-gray-200 divide-y">
          {addresses.map((a) => (
            <label key={a.id} className="flex items-start gap-3 p-4 cursor-pointer">
              <input
                type="radio"
                name="address"
                checked={choice === a.id}
                onChange={() => setChoice(a.id)}
                className="mt-1 accent-amber-400"
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
        <form onSubmit={submitNew} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="ckaddr-fullname" className="sr-only">Full name</Label>
              <Input
                id="ckaddr-fullname"
                placeholder="Full name"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                aria-invalid={!!fieldErrors.fullName}
              />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ckaddr-line1" className="sr-only">Address line 1</Label>
              <Input
                id="ckaddr-line1"
                placeholder="Address line 1"
                required
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                aria-invalid={!!fieldErrors.line1}
              />
              {fieldErrors.line1 && <p className="mt-1 text-xs text-red-600">{fieldErrors.line1}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ckaddr-line2" className="sr-only">Address line 2 (optional)</Label>
              <Input
                id="ckaddr-line2"
                placeholder="Address line 2 (optional)"
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ckaddr-city" className="sr-only">City</Label>
              <Input
                id="ckaddr-city"
                placeholder="City"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                aria-invalid={!!fieldErrors.city}
              />
              {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
            </div>
            <div>
              <Label htmlFor="ckaddr-state" className="sr-only">State</Label>
              <Input
                id="ckaddr-state"
                placeholder="State"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                aria-invalid={!!fieldErrors.state}
              />
              {fieldErrors.state && <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>}
            </div>
            <div>
              <Label htmlFor="ckaddr-zip" className="sr-only">ZIP code</Label>
              <Input
                id="ckaddr-zip"
                placeholder="ZIP code"
                required
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                aria-invalid={!!fieldErrors.postalCode}
              />
              {fieldErrors.postalCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.postalCode}</p>}
            </div>
            <div>
              <Label htmlFor="ckaddr-phone" className="sr-only">Phone (optional)</Label>
              <Input
                id="ckaddr-phone"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                aria-invalid={!!fieldErrors.phone}
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              Use this address
            </Button>
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
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button onClick={submitExisting} disabled={submitting}>
            Deliver to this address
          </Button>
        </>
      )}
    </div>
  );
}
