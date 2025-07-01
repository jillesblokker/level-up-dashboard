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
    user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    forest_tiles_placed INT DEFAULT 0,
    forest_tiles_destroyed INT DEFAULT 0,
    water_tiles_placed INT DEFAULT 0,
    mountain_tiles_destroyed INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT now()
);

-- DiscoveredCreatures table
CREATE TABLE IF NOT EXISTS "DiscoveredCreatures" (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creature_id TEXT NOT NULL,
    discovered_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (user_id, creature_id)
);

-- Postgres function for atomic increment
CREATE OR REPLACE FUNCTION increment_user_progress(user_id UUID, action TEXT)
RETURNS TABLE(newValue INT) AS $$
DECLARE
  column_name TEXT;
BEGIN
  -- Map action to column
  IF action = 'forest_tiles_placed' THEN column_name := 'forest_tiles_placed';
  ELSIF action = 'forest_tiles_destroyed' THEN column_name := 'forest_tiles_destroyed';
  ELSIF action = 'water_tiles_placed' THEN column_name := 'water_tiles_placed';
  ELSIF action = 'mountain_tiles_destroyed' THEN column_name := 'mountain_tiles_destroyed';
  ELSE RAISE EXCEPTION 'Unknown action: %', action;
  END IF;

  -- Upsert row and increment
  EXECUTE format('INSERT INTO "UserCreatureProgress" (user_id, %I) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET %I = "UserCreatureProgress".%I + 1, updated_at = now() RETURNING %I', column_name, column_name, column_name, column_name)
  USING user_id
  INTO newValue;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
