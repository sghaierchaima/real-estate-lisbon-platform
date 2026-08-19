/*
  Warnings:

  - A unique constraint covering the columns `[leadId,professionalId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Match_leadId_professionalId_key" ON "Match"("leadId", "professionalId");
