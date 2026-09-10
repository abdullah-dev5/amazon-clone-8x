import Link from "next/link";
import { getCurrentUser, getSessionUserId } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { db } from "@/lib/db";
import { CartIcon } from "@/components/CartIcon";
import { AccountMenu } from "@/components/AccountMenu";
import { SearchBar } from "@/components/SearchBar";

export async function Header() {
  const [user, userId, categories] = await Promise.all([
    getCurrentUser(),
    getSessionUserId(),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const cart = await getCartView(userId);

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-[#131921] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2">
          <Link href="/" className="shrink-0 rounded px-2 py-1 hover:outline hover:outline-white/40">
            <span className="text-xl font-bold tracking-tight">amazonw</span>
          </Link>

          <div className="hidden md:flex shrink-0 flex-col justify-center px-2 py-1 rounded hover:outline hover:outline-white/40 cursor-pointer">
            <span className="text-xs text-gray-300">Deliver to</span>
            <span className="text-sm font-bold">Seattle 98109</span>
          </div>

          {/* Own full-width row on mobile (order-last + w-full inside this flex-wrap
              container) so it doesn't get squeezed by the other, non-shrinking header
              items; inline and flexible from sm breakpoint up. */}
          <SearchBar />

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
            <AccountMenu userName={user?.name ?? null} />

            <Link
              href="/account/orders"
              className="hidden sm:block px-2 py-1 rounded hover:outline hover:outline-white/40"
            >
              <div className="text-xs">Returns</div>
              <div className="font-bold text-sm">&amp; Orders</div>
            </Link>

            <CartIcon initialCount={cart.itemCount} />
          </div>
        </div>
      </div>

      <nav className="bg-[#232f3e] text-white text-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-3 py-1.5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="whitespace-nowrap rounded px-1.5 py-0.5 hover:outline hover:outline-white/40"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
