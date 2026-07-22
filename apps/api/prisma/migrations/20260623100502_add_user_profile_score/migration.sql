-- CreateEnum
CREATE TYPE "ProfileTier" AS ENUM ('REGISTERED', 'EXPLORER', 'ACTIVE_BUYER', 'QUALIFIED', 'PRIORITY');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileCompletion" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "profileTier" "ProfileTier" NOT NULL DEFAULT 'REGISTERED';
