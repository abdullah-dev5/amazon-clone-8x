import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-3 py-20 text-center">
      <PackageSearch className="mb-4 h-16 w-16 text-gray-300" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-gray-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-gray-600">
        The page you&apos;re looking for might have been moved, or the link may be broken.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          Go to homepage
        </Link>
        <Link href="/s" className={buttonVariants({ variant: "outline" })}>
          Search products
        </Link>
      </div>
    </div>
  );
}
