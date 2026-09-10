import Link from "next/link";
import { getCurrentUser, getSessionUserId } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { db } from "@/lib/db";
import { CartIcon } from "@/components/CartIcon";
import { AccountMenu } from "@/components/AccountMenu";

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

          {/* Full width on mobile so it gets its own row instead of being squeezed by the
              other (non-shrinking) header items; inline and flexible from sm breakpoint up. */}
          <form action="/s" method="GET" className="order-last w-full flex min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <input
              type="text"
              name="k"
              placeholder="Search amazonw"
              aria-label="Search products"
              className="min-w-0 flex-1 rounded-l-md px-3 py-2 text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="shrink-0 rounded-r-md bg-amber-400 px-4 py-2 hover:bg-amber-300"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-900" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
              </svg>
            </button>
          </form>

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
