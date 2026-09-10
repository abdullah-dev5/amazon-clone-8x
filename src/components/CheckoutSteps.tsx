const STEPS = [
  { id: "address", label: "Address" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

export function CheckoutSteps({ current }: { current: string }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 ${
              i === currentIndex ? "font-bold text-orange-600" : i < currentIndex ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                i <= currentIndex ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <span className="text-gray-300">›</span>}
        </div>
      ))}
    </div>
  );
}
