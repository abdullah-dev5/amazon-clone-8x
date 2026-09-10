import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { deriveDisplayStatus, displayStatusBadgeClasses, displayStatusLabel } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account/orders");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { placedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-3 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-700 mb-2">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="text-blue-700 hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const displayStatus = deriveDisplayStatus(order);
            return (
            <div key={order.id} className="rounded-lg border border-gray-300">
              <div className="flex flex-wrap justify-between gap-3 bg-gray-50 px-4 py-3 text-sm border-b border-gray-200">
                <div>
                  <p className="text-gray-500">Order placed</p>
                  <p className="font-medium text-gray-900">
                    {order.placedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">{formatPrice(order.totalCents)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ship to</p>
                  <p className="font-medium text-gray-900">{order.shipToName}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-gray-500">Order #</p>
                  <Link href={`/account/orders/${order.id}`} className="font-medium text-blue-700 hover:underline">
                    {order.id.slice(-8).toUpperCase()}
                  </Link>
                </div>
              </div>
              <div className="p-4 flex flex-wrap gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="relative h-16 w-16 overflow-hidden rounded bg-gray-100">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.productTitle} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                ))}
                <div className="ml-auto self-center">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${displayStatusBadgeClasses(displayStatus)}`}>
                    {displayStatusLabel(displayStatus)}
                  </span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
