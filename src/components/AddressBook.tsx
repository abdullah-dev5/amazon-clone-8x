"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { addressSchema } from "@/lib/validation/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";

export type AddressData = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string | null;
  isDefault: boolean;
};

const emptyForm = { fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", phone: "" };

export function AddressBook({ initialAddresses }: { initialAddresses: AddressData[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function addAddress(e: React.FormEvent) {
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
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    setAddresses((prev) => [...prev.map((a) => ({ ...a, isDefault: data.isDefault ? false : a.isDefault })), data]);
    setForm(emptyForm);
    setShowForm(false);
    setSubmitting(false);
    router.refresh();
  }

  async function setDefault(id: string) {
    const snapshot = addresses;
    setError(null);
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setDefault: true }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setAddresses(snapshot);
      setError("Couldn't update your default address. Please try again.");
    }
  }

  async function remove(id: string) {
    const snapshot = addresses;
    setError(null);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setAddresses(snapshot);
      setError("Couldn't remove that address. Please try again.");
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState icon={<MapPin className="h-10 w-10" />} title="You haven't saved any addresses yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-lg border border-gray-200 p-4 text-sm space-y-1">
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
              {a.phone && <p className="text-gray-500">{a.phone}</p>}
              <div className="flex gap-3 pt-2 text-blue-700">
                {!a.isDefault && (
                  <button onClick={() => setDefault(a.id)} className="hover:underline">
                    Set as default
                  </button>
                )}
                <button onClick={() => remove(a.id)} className="hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="text-blue-700 hover:underline text-sm">
          + Add a new address
        </button>
      )}

      {showForm && (
        <form onSubmit={addAddress} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="addr-fullname" className="sr-only">Full name</Label>
              <Input id="addr-fullname" placeholder="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} aria-invalid={!!fieldErrors.fullName} />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-line1" className="sr-only">Address line 1</Label>
              <Input id="addr-line1" placeholder="Address line 1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} aria-invalid={!!fieldErrors.line1} />
              {fieldErrors.line1 && <p className="mt-1 text-xs text-red-600">{fieldErrors.line1}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-line2" className="sr-only">Address line 2 (optional)</Label>
              <Input id="addr-line2" placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="addr-city" className="sr-only">City</Label>
              <Input id="addr-city" placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} aria-invalid={!!fieldErrors.city} />
              {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
            </div>
            <div>
              <Label htmlFor="addr-state" className="sr-only">State</Label>
              <Input id="addr-state" placeholder="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} aria-invalid={!!fieldErrors.state} />
              {fieldErrors.state && <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>}
            </div>
            <div>
              <Label htmlFor="addr-zip" className="sr-only">ZIP code</Label>
              <Input id="addr-zip" placeholder="ZIP code" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} aria-invalid={!!fieldErrors.postalCode} />
              {fieldErrors.postalCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.postalCode}</p>}
            </div>
            <div>
              <Label htmlFor="addr-phone" className="sr-only">Phone (optional)</Label>
              <Input id="addr-phone" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!fieldErrors.phone} />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              Save address
            </Button>
            <button type="button" onClick={() => setShowForm(false)} className="text-blue-700 hover:underline text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
