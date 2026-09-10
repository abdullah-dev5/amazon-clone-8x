"use client";

import { useEffect } from "react";
import Link from "next/link";
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
      className="relative flex items-end gap-1.5 px-2 py-1 rounded hover:outline hover:outline-white/40"
    >
      <span className="relative inline-block h-8 w-8">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
          <path d="M7 4h-2l-1 2v1h2l3.6 7.59-1.35 2.44C7.52 17.37 8.48 19 10 19h9v-2h-9l1.1-2h6.45a2 2 0 0 0 1.79-1.11l2.58-5.15A1 1 0 0 0 21 7H6.21l-.94-2H7V4zM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </svg>
        {itemCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold leading-none text-gray-900 ring-2 ring-[#131921]"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </span>
      <span className="font-bold text-sm hidden sm:inline" aria-hidden="true">
        Cart
      </span>
    </Link>
  );
}
