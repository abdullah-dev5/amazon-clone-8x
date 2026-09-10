import { test, expect } from "@playwright/test";

/**
 * The single highest-value customer journey: discover a product, add it to
 * the cart, create an account during checkout, complete the 4-step checkout,
 * and confirm the order shows up in order history. Verifies outcomes a real
 * shopper would notice (product visible, cart total correct, order created,
 * confirmation shown, order in history) rather than implementation details.
 */
test("browse -> cart -> checkout -> order confirmation -> order history", async ({ page }) => {
  const uniqueEmail = `golden-path-${Date.now()}@example.com`;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /everything you need/i })).toBeVisible();

  // Search for a known seeded product.
  await page.getByPlaceholder("Search amazonw").fill("headphones");
  await page.getByPlaceholder("Search amazonw").press("Enter");
  await expect(page).toHaveURL(/\/s\?k=headphones/);

  const productLink = page.getByRole("link", { name: /Noise-Cancelling Over-Ear Headphones/i }).first();
  await expect(productLink).toBeVisible();
  await productLink.click();
  await expect(page).toHaveURL(/\/product\//);

  // Switch to a specific variant and confirm the price updates in place.
  await expect(page.getByRole("heading", { name: /Noise-Cancelling Over-Ear Headphones/i })).toBeVisible();
  await page.getByRole("button", { name: "Navy Blue" }).click();
  await expect(page.getByText("$134.99")).toBeVisible();

  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added/ })).toBeVisible();

  // Cart badge should reflect the item.
  await expect(page.getByRole("link", { name: /Cart/ }).getByText("1")).toBeVisible();

  await page.getByRole("link", { name: /Cart/ }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText("Navy Blue")).toBeVisible();
  await expect(page.getByText("$134.99", { exact: false }).first()).toBeVisible();

  // Proceeding to checkout as a guest should require sign-in, then return here.
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await expect(page).toHaveURL(/\/signin/);

  await page.getByRole("link", { name: /Create your amazonw account/i }).click();
  await expect(page).toHaveURL(/\/signup/);
  await page.getByLabel("Your name").fill("Golden Path Tester");
  await page.getByLabel("Email").fill(uniqueEmail);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create your account" }).click();

  // Should land back on the checkout address step with the cart preserved.
  await expect(page).toHaveURL(/\/checkout\/address/);

  await page.getByPlaceholder("Full name").fill("Golden Path Tester");
  await page.getByPlaceholder("Address line 1").fill("100 Test Fixture Ave");
  await page.getByPlaceholder("City").fill("Testopolis");
  await page.getByPlaceholder("State").fill("WA");
  await page.getByPlaceholder("ZIP code").fill("98101");
  await page.getByRole("button", { name: "Use this address" }).click();

  await expect(page).toHaveURL(/\/checkout\/delivery/);
  await page.getByRole("button", { name: "Continue to payment" }).click();

  await expect(page).toHaveURL(/\/checkout\/payment/);
  await page.getByLabel("Name on card").fill("Golden Path Tester");
  await page.getByPlaceholder("4242 4242 4242 4242").fill("4242424242424242");
  await page.getByPlaceholder("12/29").fill("12/30");
  await page.getByLabel("CVV").fill("123");
  await page.getByRole("button", { name: "Continue to review" }).click();

  await expect(page).toHaveURL(/\/checkout\/review/);
  // Standard shipping is free, so total = subtotal + tax only.
  await expect(page.getByText("$145.79")).toBeVisible(); // 134.99 + 8% tax

  await page.getByRole("button", { name: "Place your order" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmation\//);
  await expect(page.getByRole("heading", { name: /Order placed, thank you!/i })).toBeVisible();

  await page.getByRole("link", { name: "View your orders" }).click();
  await expect(page).toHaveURL(/\/account\/orders/);
  // The order list shows a thumbnail + total per order (titles are on the
  // order detail page), so assert on what's actually rendered here.
  await expect(page.getByText("$145.79")).toBeVisible();
  await expect(page.getByAltText("Noise-Cancelling Over-Ear Headphones")).toBeVisible();
});
