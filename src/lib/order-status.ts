import type { OrderStatus } from "@prisma/client";

/**
 * The customer-facing order lifecycle, persisted directly on the Order row
 * (see the OrderStatus enum in schema.prisma) — no longer derived from
 * elapsed time. There's no warehouse/carrier integration or background job
 * driving this forward; ADVANCE_TRANSITIONS below is the small,
 * ownership-gated mechanism used to move an order through these states for
 * demonstration/testing (see POST /api/account/orders/[orderId]/advance).
 */
export type DisplayOrderStatus = OrderStatus;

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

/**
 * Valid forward transitions, enforced server-side (see the advance route).
 * DELIVERED and CANCELLED are terminal — neither maps to a next status.
 */
export const ADVANCE_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};
