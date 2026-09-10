"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

export function CartIcon({ initialCount }: { initialCount: number }) {
  const itemCount = useCartStore((s) => s.itemCount);
  const setItemCount = useCartStore((s) => s.setItemCount);

  useEffect(() => {
    setItemCount(initialCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCount]);

  return (
    <Link
      href="/cart"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart"}
      className="relative flex items-end gap-1 px-2 py-1 rounded hover:outline hover:outline-white/40"
    >
      <ShoppingCart className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -top-1 left-4 text-amber-400 font-bold text-lg leading-none" aria-hidden="true">
          {itemCount}
        </span>
      )}
      <span className="font-bold text-sm hidden sm:inline" aria-hidden="true">
        Cart
      </span>
    </Link>
  );
}
