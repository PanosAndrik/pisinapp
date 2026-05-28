-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordHash" TEXT;
