-- Enable RLS on DiscoveredCreatures table
ALTER TABLE "DiscoveredCreatures" ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own discovered creatures
CREATE POLICY "Allow user to read their own discovered creatures"
  ON "DiscoveredCreatures"
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Allow users to insert their own discovered creatures
CREATE POLICY "Allow user to insert their own discovered creatures"
  ON "DiscoveredCreatures"
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id); 