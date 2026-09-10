import type { Prisma, PrismaClient } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import type { CouponInfo } from "@/lib/pricing";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type CouponValidation =
  | { valid: true; coupon: CouponInfo }
  | { valid: false; reason: string };

/**
 * Looks up a coupon by code and checks it against the given subtotal.
 * Takes a Prisma client (or an in-flight transaction client) so the exact
 * same validation logic runs for the apply-coupon preview and, unmodified,
 * again inside the place-order transaction against the live cart at commit
 * time — never a value trusted from an earlier call or from the client.
 */
export async function validateCouponCode(
  db: DbClient,
  rawCode: string,
  subtotalCents: number
): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, reason: "Enter a coupon code." };
  }

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { valid: false, reason: "This coupon code isn't valid." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "This coupon has expired." };
  }
  if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents) {
    return {
      valid: false,
      reason: `This coupon requires a subtotal of at least ${formatPrice(coupon.minSubtotalCents)}.`,
    };
  }

  return { valid: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } };
}
