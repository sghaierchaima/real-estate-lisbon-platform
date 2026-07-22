-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_buyerId_fkey";

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "buyerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
