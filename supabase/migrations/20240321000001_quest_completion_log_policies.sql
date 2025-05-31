-- Enable RLS on QuestCompletionLog table
ALTER TABLE "QuestCompletionLog" ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own quests
CREATE POLICY "Users can view their own quests"
ON "QuestCompletionLog"
FOR SELECT
USING (
  auth.uid() = "userId"
);

-- Create policy for users to insert their own quests
CREATE POLICY "Users can create their own quests"
ON "QuestCompletionLog"
FOR INSERT
WITH CHECK (
  auth.uid() = "userId"
);

-- Create policy for users to update their own quests
CREATE POLICY "Users can update their own quests"
ON "QuestCompletionLog"
FOR UPDATE
USING (
  auth.uid() = "userId"
)
WITH CHECK (
  auth.uid() = "userId"
);

-- Create policy for users to delete their own quests
CREATE POLICY "Users can delete their own quests"
ON "QuestCompletionLog"
FOR DELETE
USING (
  auth.uid() = "userId"
); 