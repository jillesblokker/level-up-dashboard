-- Enable RLS on ChallengeCompletion table
ALTER TABLE "ChallengeCompletion" ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own challenge completions
CREATE POLICY "Allow user to read their own challenge completions"
  ON "ChallengeCompletion"
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Allow users to insert their own challenge completions
CREATE POLICY "Allow user to insert their own challenge completions"
  ON "ChallengeCompletion"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId"); 