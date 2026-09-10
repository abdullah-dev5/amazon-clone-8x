"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import type { CartLineView, CartView } from "@/lib/cart";

export function CartList({ initialLines }: { initialLines: CartLineView[] }) {
  const [lines, setLines] = useState(initialLines);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const setItemCount = useCartStore((s) => s.setItemCount);

  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  function updateQuantity(variantId: string, quantity: number) {
    const snapshot = lines;
    setError(null);
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l))
    );
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cart/items/${variantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error();
        // Reconcile with the server's actual result (e.g. it may have
        // clamped the quantity to current stock) rather than trusting the
        // optimistic value.
        const cart: CartView = await res.json();
        setLines(cart.lines);
        setItemCount(cart.itemCount);
      } catch {
        setLines(snapshot);
        setError("Couldn't update that item's quantity. Please try again.");
      }
    });
  }

  function removeItem(variantId: string) {
    const snapshot = lines;
    setError(null);
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cart/items/${variantId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        const cart: CartView = await res.json();
        setLines(cart.lines);
        setItemCount(cart.itemCount);
      } catch {
        setLines(snapshot);
        setError("Couldn't remove that item. Please try again.");
      }
    });
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-10 w-10" />}
        title="Your cart is empty"
        actionHref="/"
        actionLabel="Continue shopping"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
        <div className="p-4 flex justify-between text-sm text-gray-600">
          <span>{itemCount} item{itemCount === 1 ? "" : "s"} in cart</span>
        </div>
        {error && (
          <p role="alert" className="px-4 py-2 text-sm text-red-600 bg-red-50">
            {error}
          </p>
        )}
        {lines.map((line) => (
          <div key={line.variantId} className="p-4 flex gap-4">
            <Link href={`/product/${line.productSlug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
              {line.imageUrl && (
                <Image src={line.imageUrl} alt={line.productTitle} fill sizes="96px" className="object-cover" />
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${line.productSlug}`} className="font-medium text-gray-900 hover:text-orange-600 hover:underline line-clamp-2">
                {line.productTitle}
              </Link>
              <p className="text-sm text-gray-600">{line.variantName}</p>
              <p className="font-semibold text-gray-900 mt-1">{formatPrice(line.unitPriceCents)}</p>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <label className="flex items-center gap-1">
                  <span id={`qty-label-${line.variantId}`}>Qty:</span>
                  <select
                    aria-labelledby={`qty-label-${line.variantId}`}
                    value={line.quantity}
                    onChange={(e) => updateQuantity(line.variantId, Number(e.target.value))}
                    disabled={isPending}
                    className="rounded border border-gray-400 px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    {Array.from({ length: Math.min(10, line.stock) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => removeItem(line.variantId)}
                  disabled={isPending}
                  className="text-blue-700 hover:underline hover:text-orange-600"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-right font-semibold text-gray-900 shrink-0">
              {formatPrice(line.unitPriceCents * line.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 p-4 h-fit space-y-3">
        <p className="text-lg">
          Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"}):{" "}
          <span className="font-bold">{formatPrice(subtotalCents)}</span>
        </p>
        <Link href="/checkout/address" className={buttonVariants({ className: "w-full" })}>
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
