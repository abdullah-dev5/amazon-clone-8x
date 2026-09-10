import type { OrderStatus } from "@prisma/client";

/**
 * Everything a PLACED order can appear as to the customer. PROCESSING is
 * deliberately not a real column value (see schema.prisma) — there's no
 * background job in this app to drive a status forward, so "time has
 * passed since placedAt" stands in for it, computed fresh on every render
 * from a real DB field (placedAt), not from React state.
 */
export type DisplayOrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const PROCESSING_AFTER_MS = 2 * 60 * 1000; // 2 minutes
const SHIPPED_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours
const DELIVERED_AFTER_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/**
 * A persisted terminal/explicit status (CANCELLED — or SHIPPED/DELIVERED,
 * if a future fulfillment action ever sets them) always wins over the
 * time-derived guess. Only a still-PLACED order gets its display status
 * derived from elapsed time.
 */
export function deriveDisplayStatus(order: { status: OrderStatus; placedAt: Date }): DisplayOrderStatus {
  if (order.status !== "PLACED") return order.status;

  const elapsedMs = Date.now() - order.placedAt.getTime();
  if (elapsedMs < PROCESSING_AFTER_MS) return "PLACED";
  if (elapsedMs < SHIPPED_AFTER_MS) return "PROCESSING";
  if (elapsedMs < DELIVERED_AFTER_MS) return "SHIPPED";
  return "DELIVERED";
}

const LABELS: Record<DisplayOrderStatus, string> = {
  PLACED: "Order placed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const BADGE_CLASSES: Record<DisplayOrderStatus, string> = {
  PLACED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function displayStatusLabel(status: DisplayOrderStatus): string {
  return LABELS[status];
}

export function displayStatusBadgeClasses(status: DisplayOrderStatus): string {
  return BADGE_CLASSES[status];
}
