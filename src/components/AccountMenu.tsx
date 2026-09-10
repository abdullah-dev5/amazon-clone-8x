"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountMenu({ userName }: { userName: string | null }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <details className="relative group">
      <summary className="list-none cursor-pointer px-2 py-1 rounded hover:outline hover:outline-white/40 leading-tight">
        <div className="text-xs">{userName ? `Hello, ${userName.split(" ")[0]}` : "Hello, sign in"}</div>
        <div className="font-bold text-sm">Account &amp; Lists</div>
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-64 rounded border border-gray-300 bg-white text-gray-900 shadow-lg p-4">
        {!userName && (
          <Link
            href="/signin"
            className="block w-full text-center rounded bg-amber-400 py-1.5 font-medium text-sm hover:bg-amber-300"
          >
            Sign in
          </Link>
        )}
        <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
          <Link href="/account/orders" className="hover:underline hover:text-orange-600">
            Your Orders
          </Link>
          <Link href="/account/wishlist" className="hover:underline hover:text-orange-600">
            Your Wishlist
          </Link>
          <Link href="/account/addresses" className="hover:underline hover:text-orange-600">
            Your Addresses
          </Link>
          {userName && (
            <button
              onClick={signOut}
              className="text-left hover:underline hover:text-orange-600 mt-2 border-t pt-2"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
