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

-- UserCreatureProgress table
CREATE TABLE IF NOT EXISTS "UserCreatureProgress" (
    user_id UUID NOT NULL PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
    forest_tiles_placed INT DEFAULT 0,
    forest_tiles_destroyed INT DEFAULT 0,
    water_tiles_placed INT DEFAULT 0,
    mountain_tiles_destroyed INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT now()
);

-- DiscoveredCreatures table
CREATE TABLE IF NOT EXISTS "DiscoveredCreatures" (
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    creature_id TEXT NOT NULL,
    discovered_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (user_id, creature_id)
);

-- Postgres function for atomic increment
CREATE OR REPLACE FUNCTION increment_user_progress(user_id UUID, column_name TEXT)
RETURNS TABLE(new_value INT) AS $$
DECLARE
    sql TEXT;
BEGIN
    sql := format('UPDATE "UserCreatureProgress" SET %I = COALESCE(%I, 0) + 1, updated_at = now() WHERE user_id = $1 RETURNING %I', column_name, column_name, column_name);
    RETURN QUERY EXECUTE sql USING user_id;
END;
$$ LANGUAGE plpgsql;
