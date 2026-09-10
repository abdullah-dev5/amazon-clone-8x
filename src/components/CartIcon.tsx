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
    <Link href="/cart" className="relative flex items-end gap-1 px-2 py-1 rounded hover:outline hover:outline-white/40">
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
        <path d="M7 4h-2l-1 2v1h2l3.6 7.59-1.35 2.44C7.52 17.37 8.48 19 10 19h9v-2h-9l1.1-2h6.45a2 2 0 0 0 1.79-1.11l2.58-5.15A1 1 0 0 0 21 7H6.21l-.94-2H7V4zM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
      </svg>
      <span className="absolute -top-1 left-3 text-amber-400 font-bold text-lg leading-none">
        {itemCount > 0 ? itemCount : ""}
      </span>
      <span className="font-bold text-sm hidden sm:inline">Cart</span>
    </Link>
  );
}
