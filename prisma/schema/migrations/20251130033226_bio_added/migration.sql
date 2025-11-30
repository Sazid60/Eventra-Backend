/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - Added the required column `bio` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Made the column `profilePhoto` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "address",
ADD COLUMN     "bio" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ALTER COLUMN "profilePhoto" SET NOT NULL;
