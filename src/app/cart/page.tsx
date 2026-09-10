import { getSessionUserId } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { CartList } from "@/components/CartList";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const userId = await getSessionUserId();
  const cart = await getCartView(userId);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
      <CartList initialLines={cart.lines} />
    </div>
  );
}
