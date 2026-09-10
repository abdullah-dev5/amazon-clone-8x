-- Prisma's SQLite provider represents an enum column as plain TEXT with no
-- database-level constraint — enum validity is enforced only by the Prisma
-- Client/TypeScript layer. Since a real fulfillment/cancellation status is
-- exactly the kind of business-critical invariant that should be protected
-- by the database itself (not solely by application code), this migration
-- adds an explicit CHECK constraint matching the OrderStatus enum, using
-- the same table-rebuild technique Prisma itself uses for SQLite column
-- changes (SQLite has no ALTER TABLE ... ADD CONSTRAINT).
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
    "subtotalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "placedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("id", "userId", "status", "idempotencyKey", "addressId", "shipToName", "shipToLine1", "shipToLine2", "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry", "deliveryOption", "subtotalCents", "shippingCents", "taxCents", "totalCents", "placedAt")
SELECT "id", "userId", "status", "idempotencyKey", "addressId", "shipToName", "shipToLine1", "shipToLine2", "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry", "deliveryOption", "subtotalCents", "shippingCents", "taxCents", "totalCents", "placedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
