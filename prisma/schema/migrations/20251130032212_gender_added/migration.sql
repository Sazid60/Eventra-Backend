-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_hostId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_hostId_fkey";

-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "income" DOUBLE PRECISION NOT NULL DEFAULT 0;
