import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account/orders");

  const { orderId } = await params;
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-3 py-6">
      <Link href="/account/orders" className="text-sm text-blue-700 hover:underline">
        &larr; Back to your orders
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">
        Order #{order.id.slice(-8).toUpperCase()}
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        Placed on{" "}
        {order.placedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="rounded-lg border border-gray-300 p-4 mb-4">
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 mb-3">
          {order.status === "PLACED" ? "Order placed" : order.status}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Shipping address</h2>
            <p className="text-gray-700">{order.shipToName}</p>
            <p className="text-gray-700">
              {order.shipToLine1}
              {order.shipToLine2 ? `, ${order.shipToLine2}` : ""}
            </p>
            <p className="text-gray-700">
              {order.shipToCity}, {order.shipToState} {order.shipToPostalCode}
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Delivery</h2>
            <p className="text-gray-700">{order.deliveryOption}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 divide-y mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="p-4 flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.productTitle} fill sizes="64px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-900">{item.productTitle}</p>
              <p className="text-gray-600">
                {item.variantName} · Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatPrice(item.unitPriceCents * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-300 p-4 text-sm space-y-1 max-w-xs ml-auto">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span>{formatPrice(order.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping:</span>
          <span>{order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax:</span>
          <span>{formatPrice(order.taxCents)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-1">
          <span>Total:</span>
          <span>{formatPrice(order.totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
