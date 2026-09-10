import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCheckoutState } from "@/lib/checkout";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { PaymentStepForm } from "@/components/PaymentStepForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPaymentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/checkout/payment");

  const state = await getCheckoutState();
  if (!state.addressId) redirect("/checkout/address");
  if (!state.deliveryOptionId) redirect("/checkout/delivery");

  return (
    <div className="mx-auto max-w-3xl px-3 py-6">
      <CheckoutSteps current="payment" />
      <h1 className="text-xl font-bold text-gray-900 mb-4">Enter payment details</h1>
      <PaymentStepForm />
    </div>
  );
}
