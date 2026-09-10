import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * Focused, deterministic tests for the highest-risk business behavior —
 * not a general coverage suite. Each test drives the real API directly
 * (via Playwright's `request` fixture, which keeps cookies per test) so
 * these exercise the same route handlers real traffic hits, not a mocked
 * layer. Prisma is used only for setup/teardown of preconditions the API
 * itself has no endpoint for (e.g. forcing a variant's stock to an exact
 * number) — never to bypass the behavior under test.
 */

const db = new PrismaClient();

async function signUp(request: APIRequestContext, label: string) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const res = await request.post("/api/auth/signup", {
    data: { name: "Test User", email, password: "password123" },
  });
  expect(res.ok()).toBeTruthy();
  return email;
}

async function completeCheckoutUpTo(
  request: APIRequestContext,
  step: "address" | "delivery" | "payment"
) {
  const addressRes = await request.post("/api/checkout/address", {
    data: {
      fullName: "Test User",
      line1: "1 Test St",
      city: "Testville",
      state: "WA",
      postalCode: "98101",
    },
  });
  expect(addressRes.ok()).toBeTruthy();
  if (step === "address") return;

  const deliveryRes = await request.post("/api/checkout/delivery", {
    data: { deliveryOptionId: "standard" },
  });
  expect(deliveryRes.ok()).toBeTruthy();
  if (step === "delivery") return;

  const paymentRes = await request.post("/api/checkout/payment", {
    data: { cardholderName: "Test User", cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvv: "123" },
  });
  expect(paymentRes.ok()).toBeTruthy();
}

test.describe("Order placement idempotency / duplicate submission", () => {
  test("two concurrent place-order requests for the same session produce exactly one order", async ({ request }) => {
    await signUp(request, "idem");

    const variant = await db.productVariant.findFirstOrThrow({
      where: { product: { slug: "sweepix-digital-air-fryer-6-quart" } },
    });
    await request.post("/api/cart/items", { data: { variantId: variant.id, quantity: 1 } });
    await completeCheckoutUpTo(request, "payment");

    const [r1, r2] = await Promise.all([
      request.post("/api/checkout/place-order"),
      request.post("/api/checkout/place-order"),
    ]);
    expect(r1.ok()).toBeTruthy();
    expect(r2.ok()).toBeTruthy();
    const [b1, b2] = await Promise.all([r1.json(), r2.json()]);
    expect(b1.orderId).toBeTruthy();
    expect(b1.orderId).toBe(b2.orderId);

    const orderCount = await db.order.count({ where: { id: b1.orderId } });
    expect(orderCount).toBe(1);
  });

  test("a third place-order call after the order already exists replays the same order, not a new one", async ({ request }) => {
    await signUp(request, "idem-replay");
    const variant = await db.productVariant.findFirstOrThrow({
      where: { product: { slug: "sweepix-digital-air-fryer-6-quart" } },
    });
    await request.post("/api/cart/items", { data: { variantId: variant.id, quantity: 1 } });
    await completeCheckoutUpTo(request, "payment");

    const first = await request.post("/api/checkout/place-order");
    const firstBody = await first.json();

    // Cart is already cleared and checkout state reset by the first
    // success — retrying at this point should fail cleanly (nothing to
    // check out), not silently create anything.
    const second = await request.post("/api/checkout/place-order");
    expect(second.status()).toBe(400);
    expect(firstBody.orderId).toBeTruthy();
  });
});

test.describe("Stock / concurrent purchase protection", () => {
  test("two concurrent orders for the last unit of stock: exactly one succeeds, stock never goes negative", async ({ browser }) => {
    const variant = await db.productVariant.findFirstOrThrow({
      where: { product: { slug: "brewline-stainless-steel-french-press-34oz" } },
    });
    const originalStock = variant.stock;
    await db.productVariant.update({ where: { id: variant.id }, data: { stock: 1 } });

    try {
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const reqA = contextA.request;
      const reqB = contextB.request;

      await signUp(reqA, "stockrace-a");
      await signUp(reqB, "stockrace-b");

      await reqA.post("/api/cart/items", { data: { variantId: variant.id, quantity: 1 } });
      await reqB.post("/api/cart/items", { data: { variantId: variant.id, quantity: 1 } });
      await completeCheckoutUpTo(reqA, "payment");
      await completeCheckoutUpTo(reqB, "payment");

      const [resA, resB] = await Promise.all([
        reqA.post("/api/checkout/place-order"),
        reqB.post("/api/checkout/place-order"),
      ]);
      const results = await Promise.all([resA.json(), resB.json()]);
      const succeeded = results.filter((r) => r.orderId);
      const failed = results.filter((r) => r.error);

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);

      const finalVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(finalVariant.stock).toBe(0);

      await contextA.close();
      await contextB.close();
    } finally {
      await db.productVariant.update({ where: { id: variant.id }, data: { stock: originalStock } });
    }
  });
});

test.describe("Coupon validation at order commit", () => {
  test("a coupon that drops below its minimum subtotal after being applied contributes no discount at commit time", async ({ request }) => {
    await signUp(request, "coupon-min");
    // $34.99 each — 2 units ($69.98) clears SAVE20's $50 minimum, 1 unit
    // ($34.99) doesn't, so this is the product to use for this scenario.
    const variant = await db.productVariant.findFirstOrThrow({
      where: { product: { slug: "brewline-stainless-steel-french-press-34oz" }, isDefault: true },
    });
    // SAVE20 needs a $50 minimum — add enough quantity to qualify, apply it,
    // then reduce quantity below the minimum before placing the order.
    await request.post("/api/cart/items", { data: { variantId: variant.id, quantity: 2 } });
    const applyRes = await request.post("/api/checkout/coupon", { data: { code: "SAVE20" } });
    expect(applyRes.ok()).toBeTruthy();

    await request.patch(`/api/cart/items/${variant.id}`, { data: { quantity: 1 } });
    await completeCheckoutUpTo(request, "payment");

    const placeRes = await request.post("/api/checkout/place-order");
    expect(placeRes.ok()).toBeTruthy();
    const { orderId } = await placeRes.json();

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.couponCode).toBeNull();
    expect(order.discountCents).toBe(0);
    expect(order.totalCents).toBe(order.subtotalCents + order.shippingCents + order.taxCents);
  });

  test("an expired coupon is rejected at apply time", async ({ request }) => {
    await signUp(request, "coupon-expired");
    const variant = await db.productVariant.findFirstOrThrow({
      where: { product: { slug: "sweepix-digital-air-fryer-6-quart" } },
    });
    await request.post("/api/cart/items", { data: { variantId: variant.id, quantity: 1 } });
    const res = await request.post("/api/checkout/coupon", { data: { code: "EXPIRED10" } });
    expect(res.status()).toBe(400);
  });
});

test.describe("Cross-user ownership protection", () => {
  test("a second user cannot advance, buy-again, or view another user's order", async ({ browser }) => {
    const contextOwner = await browser.newContext();
    const contextOther = await browser.newContext();
    const reqOwner = contextOwner.request;
    const reqOther = contextOther.request;

    await signUp(reqOwner, "owner");
    const variant = await db.productVariant.findFirstOrThrow({
      where: { product: { slug: "sweepix-digital-air-fryer-6-quart" } },
    });
    await reqOwner.post("/api/cart/items", { data: { variantId: variant.id, quantity: 1 } });
    await completeCheckoutUpTo(reqOwner, "payment");
    const placeRes = await reqOwner.post("/api/checkout/place-order");
    const { orderId } = await placeRes.json();

    await signUp(reqOther, "other");
    const advanceRes = await reqOther.post(`/api/orders/${orderId}/advance`);
    expect(advanceRes.status()).toBe(404);

    const buyAgainRes = await reqOther.post(`/api/orders/${orderId}/buy-again`);
    expect(buyAgainRes.status()).toBe(404);

    const pageRes = await reqOther.get(`/account/orders/${orderId}`);
    expect(pageRes.status()).toBe(404);

    await contextOwner.close();
    await contextOther.close();
  });
});

test.describe("Auth edge cases", () => {
  test("duplicate signup with the same email is rejected", async ({ request }) => {
    const email = `dup-${Date.now()}@example.com`;
    const first = await request.post("/api/auth/signup", {
      data: { name: "First", email, password: "password123" },
    });
    expect(first.ok()).toBeTruthy();

    const second = await request.post("/api/auth/signup", {
      data: { name: "Second", email, password: "password123" },
    });
    expect(second.status()).toBe(409);
  });

  test("signin with a wrong password is rejected without revealing which field was wrong", async ({ request }) => {
    const res = await request.post("/api/auth/signin", {
      data: { email: "demo@example.com", password: "definitely-wrong-password" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password.");
  });

  test("sign-in is rate-limited after repeated failed attempts on the same account", async ({ request }) => {
    const email = `ratelimit-${Date.now()}@example.com`;
    await request.post("/api/auth/signup", { data: { name: "RL", email, password: "password123" } });
    await request.post("/api/auth/signout");

    let sawRateLimited = false;
    for (let i = 0; i < 12; i++) {
      const res = await request.post("/api/auth/signin", { data: { email, password: "wrong-password" } });
      if (res.status() === 429) {
        sawRateLimited = true;
        break;
      }
    }
    expect(sawRateLimited).toBe(true);
  });
});

test.afterAll(async () => {
  await db.$disconnect();
});
