import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";

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
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Order placed, thank you!</h1>
      <p className="text-gray-600 mb-6">
        Confirmation for order <span className="font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
      </p>

      <div className="rounded-lg border border-gray-200 p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Order total</span>
          <span className="font-semibold">{formatPrice(order.totalCents)}</span>
        </div>
        {order.discountCents > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Coupon {order.couponCode}</span>
            <span>-{formatPrice(order.discountCents)}</span>
          </div>
        )}
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

        <div className="border-t border-gray-200 pt-3 space-y-2">
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

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className={buttonVariants()}>
          View your orders
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
