-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "highlights" TEXT[],
    "avgPrice" INTEGER,
    "pricePerSqm" INTEGER,
    "rentYield" DOUBLE PRECISION,
    "growthPercent" DOUBLE PRECISION,
    "schoolsCount" INTEGER NOT NULL DEFAULT 0,
    "transportCount" INTEGER NOT NULL DEFAULT 0,
    "amenitiesCount" INTEGER NOT NULL DEFAULT 0,
    "schoolsScore" DOUBLE PRECISION,
    "transportScore" DOUBLE PRECISION,
    "amenitiesScore" DOUBLE PRECISION,
    "safetyScore" DOUBLE PRECISION,
    "aiScore" INTEGER,
    "aiSummary" TEXT,
    "icon" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sourceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_name_key" ON "Neighborhood"("name");
