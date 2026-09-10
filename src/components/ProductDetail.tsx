"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Check } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export type VariantData = {
  id: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  imageUrl: string | null;
  isDefault: boolean;
};

export type ProductDetailData = {
  slug: string;
  title: string;
  brand: string | null;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  variants: VariantData[];
};

export function ProductDetail({
  product,
  initialWishlistedVariantIds = [],
  signedIn,
}: {
  product: ProductDetailData;
  initialWishlistedVariantIds?: string[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorIsWarning, setErrorIsWarning] = useState(false);
  const [wishlisted, setWishlisted] = useState(new Set(initialWishlistedVariantIds));

  const selected = product.variants.find((v) => v.id === selectedId) ?? defaultVariant;
  const isMultiVariant = product.variants.length > 1;
  const heroImage = selected?.imageUrl ?? product.images[0];
  const inStock = (selected?.stock ?? 0) > 0;
  const setItemCount = useCartStore((s) => s.setItemCount);
  const isWishlisted = !!selected && wishlisted.has(selected.id);

  async function toggleWishlist() {
    if (!selected) return;
    if (!signedIn) {
      router.push(`/signin?next=/product/${product.slug}`);
      return;
    }
    const variantId = selected.id;
    const snapshot = wishlisted;
    const next = new Set(wishlisted);
    const wasWishlisted = next.has(variantId);
    if (wasWishlisted) {
      next.delete(variantId);
    } else {
      next.add(variantId);
    }
    setWishlisted(next);
    setErrorMessage(null);
    setErrorIsWarning(false);

    try {
      const res = wasWishlisted
        ? await fetch(`/api/wishlist/${variantId}`, { method: "DELETE" })
        : await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId }),
          });
      if (!res.ok) throw new Error();
    } catch {
      setWishlisted(snapshot);
      setErrorMessage("Couldn't update your wishlist. Please try again.");
    }
  }

  /** Returns whether the item was actually added — callers that need to
   * chain a next step (Buy Now) should check this rather than assuming
   * success. */
  async function addToCart(): Promise<boolean> {
    if (!selected) return false;
    setStatus("adding");
    setErrorMessage(null);
    setErrorIsWarning(false);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(data?.error ?? "Something went wrong adding this to your cart.");
        setStatus("error");
        return false;
      }
      setItemCount(data.itemCount);
      if (data.clamped) {
        setErrorMessage("We adjusted the quantity in your cart to match available stock.");
        setErrorIsWarning(true);
      }
      setStatus("added");
      return true;
    } catch {
      setErrorMessage("Something went wrong adding this to your cart.");
      setStatus("error");
      return false;
    }
  }

  async function buyNow() {
    const added = await addToCart();
    if (added) {
      router.push("/checkout/address");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-4">
        <div className="flex sm:flex-col gap-2 order-2 sm:order-1">
          {product.images.map((img, i) => (
            <div
              key={i}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-gray-200"
            >
              <Image src={img} alt={`${product.title} thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 order-1 sm:order-2">
          {heroImage && (
            <Image
              src={heroImage}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
              priority
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          {product.brand && (
            <Link href={`/s?k=${encodeURIComponent(product.brand)}`} className="text-sm text-blue-700 hover:underline">
              Visit the {product.brand} Store
            </Link>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{product.title}</h1>
          <div className="mt-1">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} linkToReviews />
          </div>
        </div>

        <div className="border-t border-b border-gray-200 py-3">
          {selected && <PriceTag priceCents={selected.priceCents} compareAtCents={selected.compareAtCents} size="lg" />}
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>

        {isMultiVariant && (
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Option: <span className="font-normal">{selected?.name}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`rounded border px-3 py-1.5 text-sm ${
                    v.id === selectedId
                      ? "border-orange-500 ring-1 ring-orange-500 text-orange-700 font-medium"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  } ${v.stock === 0 ? "opacity-40" : ""}`}
                >
                  {v.name}
                  {v.stock === 0 && " (out of stock)"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 p-4 space-y-3 lg:sticky lg:top-24">
          <p className={`text-lg font-medium ${inStock ? "text-green-700" : "text-red-600"}`}>
            {inStock ? "In Stock" : "Out of Stock"}
          </p>

          {inStock && (
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="qty" className="text-gray-700">
                Qty:
              </label>
              <select
                id="qty"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded border border-gray-400 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {Array.from({ length: Math.min(10, selected?.stock ?? 1) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button onClick={addToCart} disabled={!inStock || status === "adding"} className="w-full">
            {status === "adding" ? (
              "Adding…"
            ) : status === "added" ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4" /> Added
              </span>
            ) : (
              "Add to Cart"
            )}
          </Button>
          <Button onClick={buyNow} disabled={!inStock || status === "adding"} variant="accent" className="w-full">
            Buy Now
          </Button>
          {errorMessage && (
            <p role="alert" className={`text-sm ${errorIsWarning ? "text-amber-700" : "text-red-600"}`}>
              {errorMessage}
            </p>
          )}
          {/* Deliberately lighter weight than the two CTAs above it — a
              save-for-later action shouldn't compete with the purchase path. */}
          <button
            onClick={toggleWishlist}
            className="flex w-full items-center justify-center gap-1.5 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} strokeWidth={2} />
            {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
