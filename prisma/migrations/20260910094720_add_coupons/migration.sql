-- CreateTable
-- (type has an explicit CHECK — see the note on the Order.status rebuild
-- below: Prisma's SQLite provider never generates one for an enum column
-- on its own.)
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('PERCENT', 'FIXED')),
    "value" INTEGER NOT NULL,
    "minSubtotalCents" INTEGER,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
-- Prisma's own table-rebuild (required because SQLite has no ALTER COLUMN)
-- regenerates this CREATE TABLE from its schema model, which has no idea
-- a CHECK constraint was hand-added in a previous migration — so it gets
-- silently dropped unless re-added here. Discovered when this migration's
-- auto-generated SQL lost the constraint added in
-- 20260910093757_add_cancelled_order_status. This is a real, recurring
-- fragility of hand-added SQLite CHECK constraints under Prisma: it must
-- be re-verified (and re-added if missing) after any future migration
-- that touches the Order table.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED' CHECK ("status" IN ('PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
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
INSERT INTO "new_Order" ("addressId", "deliveryOption", "id", "idempotencyKey", "placedAt", "shipToCity", "shipToCountry", "shipToLine1", "shipToLine2", "shipToName", "shipToPostalCode", "shipToState", "shippingCents", "status", "subtotalCents", "taxCents", "totalCents", "userId") SELECT "addressId", "deliveryOption", "id", "idempotencyKey", "placedAt", "shipToCity", "shipToCountry", "shipToLine1", "shipToLine2", "shipToName", "shipToPostalCode", "shipToState", "shippingCents", "status", "subtotalCents", "taxCents", "totalCents", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
