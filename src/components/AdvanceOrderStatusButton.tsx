"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { displayStatusLabel } from "@/lib/order-status";

/**
 * Dev-only affordance (never rendered in production — see the order detail
 * page) for moving a demo order through its lifecycle without a real
 * warehouse/carrier integration.
 */
export function AdvanceOrderStatusButton({
  orderId,
  nextStatus,
}: {
  orderId: string;
  nextStatus: OrderStatus;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advance() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/advance`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Couldn't advance this order.");
      setSubmitting(false);
      return;
    }
    router.refresh();
    setSubmitting(false);
  }

  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-2.5 flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium text-gray-500">Dev tools:</span>
      <Button type="button" variant="outline" size="sm" onClick={advance} disabled={submitting}>
        {submitting ? "Advancing…" : `Mark as ${displayStatusLabel(nextStatus)}`}
      </Button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
