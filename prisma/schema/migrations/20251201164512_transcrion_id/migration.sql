/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `event_participants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionId` to the `event_participants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_participants" ADD COLUMN     "transactionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_transactionId_key" ON "event_participants"("transactionId");
