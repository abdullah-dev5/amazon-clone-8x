import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, MapPin, Heart, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LINKS: { href: string; label: string; desc: string; icon: LucideIcon }[] = [
  { href: "/account/orders", label: "Your Orders", desc: "Track, view, or reorder past purchases.", icon: Package },
  { href: "/account/addresses", label: "Your Addresses", desc: "Manage your shipping addresses.", icon: MapPin },
  { href: "/account/wishlist", label: "Your Wishlist", desc: "Items you've saved for later.", icon: Heart },
];

export default async function AccountHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account");

  return (
    <div className="mx-auto max-w-4xl px-3 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Account</h1>
      <p className="text-gray-600 mb-6">Hello, {user.name}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-gray-200 p-6 transition hover:border-gray-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <l.icon className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-gray-900">{l.label}</h2>
            <p className="text-sm text-gray-600 mt-1">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
