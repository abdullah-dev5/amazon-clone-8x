import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

function toCardData(product: {
  slug: string;
  title: string;
  rating: number;
  reviewCount: number;
  images: string;
  variants: { priceCents: number; compareAtCents: number | null; imageUrl: string | null; isDefault: boolean }[];
}): ProductCardData {
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const images: string[] = JSON.parse(product.images);
  return {
    slug: product.slug,
    title: product.title,
    rating: product.rating,
    reviewCount: product.reviewCount,
    imageUrl: defaultVariant?.imageUrl ?? images[0],
    priceCents: defaultVariant?.priceCents ?? 0,
    compareAtCents: defaultVariant?.compareAtCents ?? null,
  };
}

export default async function HomePage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        orderBy: { createdAt: "asc" },
        take: 4,
        include: { variants: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 space-y-6">
      <section className="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-800 to-slate-600 text-white">
        <div className="px-8 py-12 max-w-xl">
          <h1 className="text-3xl font-bold mb-2">Everything you need, all in one place</h1>
          <p className="text-slate-200 mb-4">
            Explore deals across electronics, home, fashion, and more.
          </p>
          <Link
            href="/c/electronics"
            className="inline-block rounded bg-amber-400 px-5 py-2 font-semibold text-gray-900 hover:bg-amber-300"
          >
            Shop now
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/c/${c.slug}`}
            className="group rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded bg-gray-100">
              {c.imageUrl && (
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  fill
                  sizes="200px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              )}
            </div>
            <h2 className="mt-2 text-sm font-semibold text-gray-800">{c.name}</h2>
            <span className="text-sm text-blue-700 group-hover:underline">Shop now</span>
          </Link>
        ))}
      </section>

      {categories.map((c) => (
        <section key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
            <Link href={`/c/${c.slug}`} className="text-sm text-blue-700 hover:underline">
              See more
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {c.products.map((p) => (
              <ProductCard key={p.id} product={toCardData(p)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
