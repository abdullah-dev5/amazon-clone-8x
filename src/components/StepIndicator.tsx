import { Check } from "lucide-react";

export type Step = { id: string; label: string };

/**
 * Shared horizontal progress stepper used by both the checkout flow
 * (CheckoutSteps) and order tracking (OrderStatusTracker) — previously two
 * separate implementations with subtly different "current vs done" logic.
 * A completed step shows a checkmark; the current step shows its number in
 * a ring; not-yet-reached steps are muted. Never relies on color alone —
 * the checkmark/number difference carries the state too.
 */
export function StepIndicator({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  const groupLabel =
    currentIndex >= steps.length
      ? `All ${steps.length} steps complete`
      : `Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex]?.label}`;
  return (
    <div role="group" aria-label={groupLabel} className="flex items-start">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? "bg-green-600 text-white"
                    : isCurrent
                      ? "bg-orange-500 text-white ring-2 ring-orange-200"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-xs text-center whitespace-nowrap ${
                  isCurrent ? "font-semibold text-gray-900" : isDone ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div aria-hidden="true" className={`mx-1.5 h-0.5 flex-1 transition-colors ${isDone ? "bg-green-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
