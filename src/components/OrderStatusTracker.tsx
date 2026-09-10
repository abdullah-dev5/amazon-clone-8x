import type { DisplayOrderStatus } from "@/lib/order-status";

const STAGES: { id: DisplayOrderStatus; label: string }[] = [
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

  const currentIndex = STAGES.findIndex((s) => s.id === status);

  return (
    <div
      role="group"
      aria-label={`Order status: ${STAGES[currentIndex]?.label ?? status}`}
      className="flex items-start"
    >
      {STAGES.map((stage, i) => (
        <div key={stage.id} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i <= currentIndex ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs text-center whitespace-nowrap ${
                i === currentIndex ? "font-semibold text-gray-900" : i < currentIndex ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {stage.label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div
              aria-hidden="true"
              className={`mx-1.5 h-0.5 flex-1 ${i < currentIndex ? "bg-green-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
