import { cookies } from "next/headers";
import { db } from "@/lib/db";

const GUEST_CART_COOKIE = "guest_cart";

export type GuestCartLine = { variantId: string; quantity: number };

export type CartLineView = {
  variantId: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  stock: number;
};

export type CartView = {
  lines: CartLineView[];
  subtotalCents: number;
  itemCount: number;
};

// ---- guest cart (cookie-backed, merged into the DB cart on sign-in) ----

async function readGuestCart(): Promise<GuestCartLine[]> {
  const store = await cookies();
  const raw = store.get(GUEST_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is GuestCartLine =>
        l && typeof l.variantId === "string" && typeof l.quantity === "number"
    );
  } catch {
    return [];
  }
}

async function writeGuestCart(lines: GuestCartLine[]) {
  const store = await cookies();
  store.set(GUEST_CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function addGuestItem(variantId: string, quantity: number) {
  const lines = await readGuestCart();
  const existing = lines.find((l) => l.variantId === variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({ variantId, quantity });
  }
  await writeGuestCart(lines);
}

export async function updateGuestItem(variantId: string, quantity: number) {
  const lines = await readGuestCart();
  const next =
    quantity <= 0
      ? lines.filter((l) => l.variantId !== variantId)
      : lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l));
  await writeGuestCart(next);
}

export async function removeGuestItem(variantId: string) {
  await updateGuestItem(variantId, 0);
}

export async function clearGuestCart() {
  const store = await cookies();
  store.delete(GUEST_CART_COOKIE);
}

// ---- signed-in cart (DB-backed) ----

export async function getOrCreateUserCart(userId: string) {
  const existing = await db.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.cart.create({ data: { userId } });
}

export async function addUserItem(userId: string, variantId: string, quantity: number) {
  const cart = await getOrCreateUserCart(userId);
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

export async function updateUserItem(userId: string, variantId: string, quantity: number) {
  const cart = await getOrCreateUserCart(userId);
  if (quantity <= 0) {
    await db.cartItem
      .delete({ where: { cartId_variantId: { cartId: cart.id, variantId } } })
      .catch(() => undefined);
  } else {
    await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, variantId, quantity },
      update: { quantity },
    });
  }
}

export async function removeUserItem(userId: string, variantId: string) {
  await updateUserItem(userId, variantId, 0);
}

/** Merge the guest cart cookie (if any) into the signed-in user's DB cart, then clear the cookie. */
export async function mergeGuestCartIntoUser(userId: string) {
  const guestLines = await readGuestCart();
  if (guestLines.length === 0) return;

  const cart = await getOrCreateUserCart(userId);
  for (const line of guestLines) {
    await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: line.variantId } },
      create: { cartId: cart.id, variantId: line.variantId, quantity: line.quantity },
      update: { quantity: { increment: line.quantity } },
    });
  }
  await clearGuestCart();
}

// ---- unified view, resolved against product/variant data ----

async function resolveLines(lines: GuestCartLine[]): Promise<CartLineView[]> {
  if (lines.length === 0) return [];
  const variantIds = lines.map((l) => l.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const views: CartLineView[] = [];
  for (const line of lines) {
    const v = byId.get(line.variantId);
    if (!v) continue;
    views.push({
      variantId: v.id,
      productSlug: v.product.slug,
      productTitle: v.product.title,
      variantName: v.name,
      imageUrl: v.imageUrl,
      unitPriceCents: v.priceCents,
      quantity: line.quantity,
      stock: v.stock,
    });
  }
  return views;
}

function summarize(lines: CartLineView[]): CartView {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { lines, subtotalCents, itemCount };
}

export async function getCartView(userId: string | null): Promise<CartView> {
  if (userId) {
    const cart = await db.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    const lines = cart?.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) ?? [];
    return summarize(await resolveLines(lines));
  }

  const guestLines = await readGuestCart();
  return summarize(await resolveLines(guestLines));
}
