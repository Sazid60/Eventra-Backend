/*
  Warnings:

  - Added the required column `participantId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_participants" ALTER COLUMN "participantStatus" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "participantId" TEXT NOT NULL;
