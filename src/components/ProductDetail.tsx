"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";
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
    const next = new Set(wishlisted);
    if (next.has(variantId)) {
      next.delete(variantId);
      setWishlisted(next);
      await fetch(`/api/wishlist/${variantId}`, { method: "DELETE" });
    } else {
      next.add(variantId);
      setWishlisted(next);
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
    }
  }

  async function addToCart() {
    if (!selected) return;
    setStatus("adding");
    setErrorMessage(null);
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
        return;
      }
      setItemCount(data.itemCount);
      if (data.clamped) {
        setErrorMessage("We adjusted the quantity in your cart to match available stock.");
      }
      setStatus("added");
    } catch {
      setErrorMessage("Something went wrong adding this to your cart.");
      setStatus("error");
    }
  }

  async function buyNow() {
    await addToCart();
    router.push("/checkout/address");
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
            <p className="text-sm text-blue-700 hover:underline cursor-pointer">
              Visit the {product.brand} Store
            </p>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{product.title}</h1>
          <div className="mt-1">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
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
                className="rounded border border-gray-300 px-2 py-1"
              >
                {Array.from({ length: Math.min(10, selected?.stock ?? 1) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={addToCart}
            disabled={!inStock || status === "adding"}
            className="w-full rounded-full bg-amber-400 py-2 font-medium text-gray-900 hover:bg-amber-300 disabled:opacity-50"
          >
            {status === "adding" ? "Adding…" : status === "added" ? "Added ✓" : "Add to Cart"}
          </button>
          <button
            onClick={buyNow}
            disabled={!inStock || status === "adding"}
            className="w-full rounded-full bg-orange-500 py-2 font-medium text-white hover:bg-orange-400 disabled:opacity-50"
          >
            Buy Now
          </button>
          {errorMessage && (
            <p className={`text-sm ${status === "error" ? "text-red-600" : "text-amber-700"}`}>
              {errorMessage}
            </p>
          )}
          <button
            onClick={toggleWishlist}
            className="w-full rounded-full border border-gray-400 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : "fill-none text-gray-500"}`}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 21s-7.5-4.6-10-9.3C0.3 7.9 2.4 4 6.2 4c2 0 3.6 1.1 4.8 2.9C12.2 5.1 13.8 4 15.8 4 19.6 4 21.7 7.9 22 11.7 19.5 16.4 12 21 12 21z" strokeLinejoin="round" />
            </svg>
            {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
