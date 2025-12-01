/*
  Warnings:

  - The values [BOARDGAME,CARDGAME] on the enum `EventCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [READING,DANCING,TECHNOLOGY,MOVIES,YOGA,FISHING,LANGUAGES,GARDENING,FASHION,MEDITATION,DIY,PETS,SOCIALIZING] on the enum `Interest` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventCategory_new" AS ENUM ('MUSIC', 'MOVIE', 'THEATER', 'COMEDY', 'PARTY', 'NIGHTLIFE', 'CONCERT', 'FESTIVAL', 'SPORTS', 'HIKING', 'CYCLING', 'RUNNING', 'FITNESS', 'CAMPING', 'OUTDOOR', 'ADVENTURE', 'SOCIAL', 'NETWORKING', 'MEETUP', 'COMMUNITY', 'VOLUNTEERING', 'CULTURE', 'RELIGION', 'FOOD', 'DINNER', 'COOKING', 'TASTING', 'CAFE', 'RESTAURANT', 'TECH', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'EDUCATION', 'LANGUAGE', 'BUSINESS', 'FINANCE', 'ART', 'CRAFT', 'PHOTOGRAPHY', 'PAINTING', 'WRITING', 'DANCE', 'GAMING', 'ESPORTS', 'ONLINE_EVENT', 'TRAVEL', 'TOUR', 'ROADTRIP', 'OTHER');
ALTER TABLE "events" ALTER COLUMN "category" TYPE "EventCategory_new"[] USING ("category"::text::"EventCategory_new"[]);
ALTER TYPE "EventCategory" RENAME TO "EventCategory_old";
ALTER TYPE "EventCategory_new" RENAME TO "EventCategory";
DROP TYPE "public"."EventCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Interest_new" AS ENUM ('MUSIC', 'MOVIE', 'THEATER', 'COMEDY', 'PARTY', 'NIGHTLIFE', 'CONCERT', 'FESTIVAL', 'SPORTS', 'HIKING', 'CYCLING', 'RUNNING', 'FITNESS', 'CAMPING', 'OUTDOOR', 'ADVENTURE', 'SOCIAL', 'NETWORKING', 'MEETUP', 'COMMUNITY', 'VOLUNTEERING', 'CULTURE', 'RELIGION', 'FOOD', 'DINNER', 'COOKING', 'TASTING', 'CAFE', 'RESTAURANT', 'TECH', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'EDUCATION', 'LANGUAGE', 'BUSINESS', 'FINANCE', 'ART', 'CRAFT', 'PHOTOGRAPHY', 'PAINTING', 'WRITING', 'DANCE', 'GAMING', 'ESPORTS', 'ONLINE_EVENT', 'TRAVEL', 'TOUR', 'ROADTRIP', 'OTHER');
ALTER TABLE "public"."admins" ALTER COLUMN "interests" DROP DEFAULT;
ALTER TABLE "admins" ALTER COLUMN "interests" TYPE "Interest_new"[] USING ("interests"::text::"Interest_new"[]);
ALTER TABLE "clients" ALTER COLUMN "interests" TYPE "Interest_new"[] USING ("interests"::text::"Interest_new"[]);
ALTER TABLE "hosts" ALTER COLUMN "interests" TYPE "Interest_new"[] USING ("interests"::text::"Interest_new"[]);
ALTER TYPE "Interest" RENAME TO "Interest_old";
ALTER TYPE "Interest_new" RENAME TO "Interest";
DROP TYPE "public"."Interest_old";
ALTER TABLE "admins" ALTER COLUMN "interests" SET DEFAULT ARRAY['OTHER']::"Interest"[];
COMMIT;
