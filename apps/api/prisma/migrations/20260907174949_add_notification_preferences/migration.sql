-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leadNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "matchNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "propertyAlertNotifications" BOOLEAN NOT NULL DEFAULT true;
