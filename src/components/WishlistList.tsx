"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

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
  const [error, setError] = useState<string | null>(null);
  const setItemCount = useCartStore((s) => s.setItemCount);

  async function remove(variantId: string) {
    const snapshot = lines;
    setError(null);
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
    try {
      const res = await fetch(`/api/wishlist/${variantId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setLines(snapshot);
      setError("Couldn't remove that item. Please try again.");
    }
  }

  async function moveToCart(variantId: string) {
    setMovingId(variantId);
    setError(null);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't move that item to your cart.");
        return;
      }
      setItemCount(data.itemCount);
      await remove(variantId);
    } finally {
      setMovingId(null);
    }
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-10 w-10" />}
        title="Your wishlist is empty"
        actionHref="/"
        actionLabel="Browse products"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}
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
            <Button
              size="sm"
              onClick={() => moveToCart(line.variantId)}
              disabled={!line.inStock || movingId === line.variantId}
              className="w-full"
            >
              {line.inStock ? (movingId === line.variantId ? "Moving…" : "Move to Cart") : "Out of Stock"}
            </Button>
            <button
              onClick={() => remove(line.variantId)}
              className="text-xs text-blue-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
