"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";

export type WishlistLine = {
  variantId: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  imageUrl: string | null;
  priceCents: number;
  inStock: boolean;
};

export function WishlistList({ initialLines }: { initialLines: WishlistLine[] }) {
  const [lines, setLines] = useState(initialLines);
  const [movingId, setMovingId] = useState<string | null>(null);
  const setItemCount = useCartStore((s) => s.setItemCount);

  async function remove(variantId: string) {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
    await fetch(`/api/wishlist/${variantId}`, { method: "DELETE" });
  }

  async function moveToCart(variantId: string) {
    setMovingId(variantId);
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity: 1 }),
    });
    if (res.ok) {
      const cart = await res.json();
      setItemCount(cart.itemCount);
      await remove(variantId);
    }
    setMovingId(null);
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-10 text-center">
        <p className="text-gray-700 mb-2">Your wishlist is empty.</p>
        <Link href="/" className="text-blue-700 hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {lines.map((line) => (
        <div key={line.variantId} className="rounded-lg border border-gray-200 p-3 flex flex-col gap-2">
          <Link href={`/product/${line.productSlug}`} className="relative aspect-square w-full overflow-hidden rounded bg-gray-100">
            {line.imageUrl && (
              <Image src={line.imageUrl} alt={line.productTitle} fill sizes="200px" className="object-cover" />
            )}
          </Link>
          <Link href={`/product/${line.productSlug}`} className="text-sm text-gray-800 line-clamp-2 hover:text-orange-600">
            {line.productTitle}
          </Link>
          <p className="text-xs text-gray-500">{line.variantName}</p>
          <p className="font-semibold text-gray-900">{formatPrice(line.priceCents)}</p>
          <button
            onClick={() => moveToCart(line.variantId)}
            disabled={!line.inStock || movingId === line.variantId}
            className="w-full rounded-full bg-amber-400 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
          >
            {line.inStock ? "Move to Cart" : "Out of Stock"}
          </button>
          <button
            onClick={() => remove(line.variantId)}
            className="text-xs text-blue-700 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
