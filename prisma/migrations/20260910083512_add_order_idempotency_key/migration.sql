/*
  Warnings:

  - Added the required column `idempotencyKey` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
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
INSERT INTO "new_Order" ("addressId", "deliveryOption", "id", "placedAt", "shipToCity", "shipToCountry", "shipToLine1", "shipToLine2", "shipToName", "shipToPostalCode", "shipToState", "shippingCents", "status", "subtotalCents", "taxCents", "totalCents", "userId") SELECT "addressId", "deliveryOption", "id", "placedAt", "shipToCity", "shipToCountry", "shipToLine1", "shipToLine2", "shipToName", "shipToPostalCode", "shipToState", "shippingCents", "status", "subtotalCents", "taxCents", "totalCents", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
