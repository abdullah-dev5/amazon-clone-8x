import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/** Home is always implicit and first. The final crumb (current page) never links. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-gray-600">
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />}
            {isLast || !item.href ? (
              <span className={isLast ? "text-gray-900 font-medium" : ""} aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-orange-600 hover:underline">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
