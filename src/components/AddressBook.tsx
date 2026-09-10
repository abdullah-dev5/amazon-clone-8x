"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setDefault: true }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-lg border border-gray-300 p-4 text-sm space-y-1">
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

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="text-blue-700 hover:underline text-sm">
          + Add a new address
        </button>
      )}

      {showForm && (
        <form onSubmit={addAddress} className="rounded-lg border border-gray-300 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input aria-label="Full name" placeholder="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5 sm:col-span-2" />
            <input aria-label="Address line 1" placeholder="Address line 1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5 sm:col-span-2" />
            <input aria-label="Address line 2 (optional)" placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5 sm:col-span-2" />
            <input aria-label="City" placeholder="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5" />
            <input aria-label="State" placeholder="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5" />
            <input aria-label="ZIP code" placeholder="ZIP code" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5" />
            <input aria-label="Phone (optional)" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded border border-gray-400 px-3 py-1.5" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-amber-400 px-5 py-1.5 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50">
              Save address
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-blue-700 hover:underline text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
