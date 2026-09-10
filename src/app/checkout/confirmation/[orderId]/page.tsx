import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { orderId } = await params;
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-3 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-green-600" fill="currentColor">
          <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Order placed, thank you!</h1>
      <p className="text-gray-600 mb-6">
        Confirmation for order <span className="font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
      </p>

      <div className="rounded-lg border border-gray-300 p-5 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Order total</span>
          <span className="font-semibold">{formatPrice(order.totalCents)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery</span>
          <span>{order.deliveryOption}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping to</span>
          <span className="text-right">
            {order.shipToName}
            <br />
            {order.shipToLine1}, {order.shipToCity}, {order.shipToState} {order.shipToPostalCode}
          </span>
        </div>

        <div className="border-t pt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.productTitle} ({item.variantName}) × {item.quantity}
              </span>
              <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <Link href="/account/orders" className="rounded-full bg-amber-400 px-5 py-2 font-medium text-gray-900 hover:bg-amber-300">
          View your orders
        </Link>
        <Link href="/" className="rounded-full border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
