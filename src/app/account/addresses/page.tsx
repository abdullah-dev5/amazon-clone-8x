import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressBook } from "@/components/AddressBook";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account/addresses");

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-3 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Addresses</h1>
      <AddressBook
        initialAddresses={addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          phone: a.phone,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
