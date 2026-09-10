import { StepIndicator, type Step } from "@/components/StepIndicator";

const STEPS: Step[] = [
  { id: "address", label: "Address" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

export function CheckoutSteps({ current }: { current: string }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="mb-6 max-w-md">
      <StepIndicator steps={STEPS} currentIndex={currentIndex} />
    </div>
  );
}
