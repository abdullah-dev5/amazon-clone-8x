-- Order.status's hand-added CHECK constraint (added in
-- 20260910093757_add_cancelled_order_status) only allows the enum values
-- that existed at the time and does not include the new PROCESSING value.
-- Prisma's own schema-diffing doesn't rebuild this table for an enum-value
-- addition (SQLite enums are unconstrained TEXT from Prisma's point of
-- view), so the constraint has to be widened by hand here — the exact
-- recurring fragility already documented in that earlier migration.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED' CHECK ("status" IN ('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    "idempotencyKey" TEXT NOT NULL,
    "addressId" TEXT,
    "shipToName" TEXT NOT NULL,
    "shipToLine1" TEXT NOT NULL,
    "shipToLine2" TEXT,
    "shipToCity" TEXT NOT NULL,
    "shipToState" TEXT NOT NULL,
    "shipToPostalCode" TEXT NOT NULL,
    "shipToCountry" TEXT NOT NULL,
    "deliveryOption" TEXT NOT NULL,
    "couponCode" TEXT,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "subtotalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "placedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("id", "userId", "status", "idempotencyKey", "addressId", "shipToName", "shipToLine1", "shipToLine2", "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry", "deliveryOption", "couponCode", "discountCents", "subtotalCents", "shippingCents", "taxCents", "totalCents", "placedAt")
SELECT "id", "userId", "status", "idempotencyKey", "addressId", "shipToName", "shipToLine1", "shipToLine2", "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry", "deliveryOption", "couponCode", "discountCents", "subtotalCents", "shippingCents", "taxCents", "totalCents", "placedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("authorName", "body", "createdAt", "id", "productId", "rating", "title", "userId") SELECT "authorName", "body", "createdAt", "id", "productId", "rating", "title", "userId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
