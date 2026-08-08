-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PROPERTY_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'PROPERTY_MATCH';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastMatchedAt" TIMESTAMP(3),
ADD COLUMN     "maxBudget" DOUBLE PRECISION,
ADD COLUMN     "minBudget" DOUBLE PRECISION,
ADD COLUMN     "mustHave" TEXT[],
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "propertyType" TEXT,
ADD COLUMN     "searchText" TEXT;

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- CreateIndex
CREATE INDEX "Lead_location_idx" ON "Lead"("location");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_isActive_notificationsEnabled_idx" ON "Lead"("isActive", "notificationsEnabled");
