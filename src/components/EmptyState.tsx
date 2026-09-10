import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-10 text-center">
      {icon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center text-gray-400">{icon}</div>}
      <p className="text-lg font-medium text-gray-800">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={buttonVariants({ className: "mt-4" })}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
