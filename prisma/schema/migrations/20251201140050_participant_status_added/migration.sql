-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('CONFIRMED', 'LEFT');

-- AlterTable
ALTER TABLE "event_participants" ADD COLUMN     "participantStatus" "ParticipantStatus" NOT NULL DEFAULT 'CONFIRMED';
