/*
  Warnings:

  - Added the required column `updatedAt` to the `Achievement` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `Challenge` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('might', 'knowledge', 'exploration', 'social', 'crafting', 'collection', 'honor', 'castle', 'craft', 'vitality');

-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AchievementDefinition" ADD COLUMN     "category" "Category";

-- Step 1: Add a temporary enum column to Challenge
ALTER TABLE "Challenge" ADD COLUMN "category_tmp" "Category";

-- Step 2: Copy/cast values from old category to new enum column
UPDATE "Challenge" SET "category_tmp" = CAST("category" AS "Category");

-- Step 3: Drop the old category column
ALTER TABLE "Challenge" DROP COLUMN "category";

-- Step 4: Rename the new column to category and set NOT NULL
ALTER TABLE "Challenge" RENAME COLUMN "category_tmp" TO "category";
ALTER TABLE "Challenge" ALTER COLUMN "category" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");
