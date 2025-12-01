-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "interests" "Interest"[] DEFAULT ARRAY['OTHER']::"Interest"[];
