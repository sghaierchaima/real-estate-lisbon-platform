-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "propertyId" TEXT;

-- CreateIndex
CREATE INDEX "Match_buyerId_idx" ON "Match"("buyerId");

-- CreateIndex
CREATE INDEX "Match_professionalId_idx" ON "Match"("professionalId");

-- CreateIndex
CREATE INDEX "Match_leadId_idx" ON "Match"("leadId");

-- CreateIndex
CREATE INDEX "Match_propertyId_idx" ON "Match"("propertyId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
