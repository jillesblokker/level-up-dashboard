-- CreateTable
CREATE TABLE "ChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeCompletion_userId_completedAt_idx" ON "ChallengeCompletion"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "ExperienceTransaction_userId_createdAt_idx" ON "ExperienceTransaction"("userId", "createdAt");
