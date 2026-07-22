/*
  Warnings:

  - You are about to drop the column `professionalId` on the `Property` table. All the data in the column will be lost.
  - Added the required column `professionalProfileId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_professionalId_fkey";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "professionalId",
ADD COLUMN     "professionalProfileId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "ProfessionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
