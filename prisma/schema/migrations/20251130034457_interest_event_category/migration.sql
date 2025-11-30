/*
  Warnings:

  - The `interests` column on the `clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `interests` on the `hosts` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `hosts` table. All the data in the column will be lost.
  - Added the required column `category` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bio` to the `hosts` table without a default value. This is not possible if the table is not empty.
  - Made the column `profilePhoto` on table `hosts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactNumber` on table `hosts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `hosts` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('MUSIC', 'MOVIE', 'THEATER', 'COMEDY', 'PARTY', 'NIGHTLIFE', 'CONCERT', 'FESTIVAL', 'SPORTS', 'HIKING', 'CYCLING', 'RUNNING', 'FITNESS', 'CAMPING', 'OUTDOOR', 'ADVENTURE', 'SOCIAL', 'NETWORKING', 'MEETUP', 'COMMUNITY', 'VOLUNTEERING', 'CULTURE', 'RELIGION', 'FOOD', 'DINNER', 'COOKING', 'TASTING', 'CAFE', 'RESTAURANT', 'TECH', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'EDUCATION', 'LANGUAGE', 'BUSINESS', 'FINANCE', 'ART', 'CRAFT', 'PHOTOGRAPHY', 'PAINTING', 'WRITING', 'DANCE', 'GAMING', 'ESPORTS', 'BOARDGAME', 'CARDGAME', 'ONLINE_EVENT', 'TRAVEL', 'TOUR', 'ROADTRIP', 'OTHER');

-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('MUSIC', 'SPORTS', 'HIKING', 'TRAVEL', 'COOKING', 'READING', 'DANCING', 'GAMING', 'TECHNOLOGY', 'PHOTOGRAPHY', 'ART', 'MOVIES', 'FITNESS', 'YOGA', 'CYCLING', 'RUNNING', 'CAMPING', 'FISHING', 'LANGUAGES', 'FOOD', 'VOLUNTEERING', 'GARDENING', 'WRITING', 'FASHION', 'BUSINESS', 'FINANCE', 'MEDITATION', 'DIY', 'PETS', 'SOCIALIZING', 'OTHER');

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "interests",
ADD COLUMN     "interests" "Interest"[];

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" "EventCategory" NOT NULL;

-- AlterTable
ALTER TABLE "hosts" DROP COLUMN "interests",
DROP COLUMN "isVerified",
ADD COLUMN     "bio" TEXT NOT NULL,
ALTER COLUMN "profilePhoto" SET NOT NULL,
ALTER COLUMN "contactNumber" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;
