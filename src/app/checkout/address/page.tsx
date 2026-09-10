import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCheckoutState } from "@/lib/checkout";
import { db } from "@/lib/db";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { AddressStepForm } from "@/components/AddressStepForm";

export const dynamic = "force-dynamic";

export default async function CheckoutAddressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/checkout/address");

  const [addresses, state] = await Promise.all([
    db.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    getCheckoutState(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-3 py-6">
      <CheckoutSteps current="address" />
      <h1 className="text-xl font-bold text-gray-900 mb-4">Choose a shipping address</h1>
      <AddressStepForm
        addresses={addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          isDefault: a.isDefault,
        }))}
        selectedId={state.addressId}
      />
    </div>
  );
}
