-- AlterTable
ALTER TABLE "Visit"
ADD COLUMN "chemicalAdditions" JSONB,
ADD COLUMN "cleaningChecks" JSONB,
ADD COLUMN "electricalChecks" JSONB,
ADD COLUMN "hardnessPpm" DECIMAL(6,2),
ADD COLUMN "ironPpm" DECIMAL(6,2),
ADD COLUMN "microbeTest" TEXT,
ADD COLUMN "oxygenConcentrationPpm" DECIMAL(6,2),
ADD COLUMN "pressureBarSecondary" DECIMAL(4,2),
ADD COLUMN "totalChlorinePpm" DECIMAL(5,2),
ADD COLUMN "waterClarityOk" BOOLEAN;
