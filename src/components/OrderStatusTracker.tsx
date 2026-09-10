import type { OrderStatus as DisplayOrderStatus } from "@prisma/client";
import { StepIndicator, type Step } from "@/components/StepIndicator";

const STAGES: Step[] = [
  { id: "PLACED", label: "Placed" },
  { id: "PROCESSING", label: "Processing" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
];

export function OrderStatusTracker({ status }: { status: DisplayOrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="font-semibold text-red-800">Order cancelled</p>
        <p className="text-sm text-red-700">This order was cancelled and will not be delivered.</p>
      </div>
    );
  }

  // Delivered is a completed state, not an "in progress" one — unlike
  // checkout (where the current step is always still-to-be-submitted),
  // pointing currentIndex one past the end here means every stage
  // (including the last) renders as done/checked rather than "current."
  const currentIndex = status === "DELIVERED" ? STAGES.length : STAGES.findIndex((s) => s.id === status);
  return <StepIndicator steps={STAGES} currentIndex={currentIndex} />;
}
