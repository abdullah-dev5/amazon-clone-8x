import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DELIVERY_OPTIONS, getCheckoutState } from "@/lib/checkout";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { DeliveryStepForm } from "@/components/DeliveryStepForm";

export const dynamic = "force-dynamic";

export default async function CheckoutDeliveryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/checkout/delivery");

  const state = await getCheckoutState();
  if (!state.addressId) redirect("/checkout/address");

  return (
    <div className="mx-auto max-w-3xl px-3 py-6">
      <CheckoutSteps current="delivery" />
      <h1 className="text-xl font-bold text-gray-900 mb-4">Choose a delivery speed</h1>
      <DeliveryStepForm options={DELIVERY_OPTIONS} selectedId={state.deliveryOptionId} />
    </div>
  );
}
