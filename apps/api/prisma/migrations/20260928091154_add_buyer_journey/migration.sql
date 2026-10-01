-- CreateEnum
CREATE TYPE "BuyerJourneyStatus" AS ENUM ('STARTED', 'FINANCING', 'PROFESSIONAL_MATCHING', 'PROPERTY_REVIEW', 'LEGAL_REVIEW', 'READY_TO_BUY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseGoal" AS ENUM ('PRIMARY_RESIDENCE', 'SECONDARY_RESIDENCE', 'INVESTMENT', 'RELOCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "FinancingType" AS ENUM ('CASH', 'MORTGAGE', 'MIXED', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "PurchaseTimeline" AS ENUM ('ASAP', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'SIX_TO_TWELVE_MONTHS', 'MORE_THAN_ONE_YEAR', 'UNDECIDED');

-- CreateTable
CREATE TABLE "BuyerJourney" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "goal" "PurchaseGoal",
    "estimatedBudget" DOUBLE PRECISION,
    "availableDeposit" DOUBLE PRECISION,
    "financingType" "FinancingType" NOT NULL DEFAULT 'UNDECIDED',
    "timeline" "PurchaseTimeline" NOT NULL DEFAULT 'UNDECIDED',
    "needsMortgageBroker" BOOLEAN NOT NULL DEFAULT false,
    "needsPropertyLawyer" BOOLEAN NOT NULL DEFAULT false,
    "needsTaxAdvisor" BOOLEAN NOT NULL DEFAULT false,
    "needsInsuranceBroker" BOOLEAN NOT NULL DEFAULT false,
    "status" "BuyerJourneyStatus" NOT NULL DEFAULT 'STARTED',
    "progress" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerJourney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerJourney_buyerId_idx" ON "BuyerJourney"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerJourney_propertyId_idx" ON "BuyerJourney"("propertyId");

-- CreateIndex
CREATE INDEX "BuyerJourney_status_idx" ON "BuyerJourney"("status");

-- CreateIndex
CREATE INDEX "BuyerJourney_buyerId_status_idx" ON "BuyerJourney"("buyerId", "status");

-- CreateIndex
CREATE INDEX "BuyerJourney_createdAt_idx" ON "BuyerJourney"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerJourney_buyerId_propertyId_key" ON "BuyerJourney"("buyerId", "propertyId");

-- AddForeignKey
ALTER TABLE "BuyerJourney" ADD CONSTRAINT "BuyerJourney_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerJourney" ADD CONSTRAINT "BuyerJourney_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
