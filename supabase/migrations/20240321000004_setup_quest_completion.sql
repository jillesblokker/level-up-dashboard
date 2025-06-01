-- Enable RLS on QuestCompletion table
ALTER TABLE public."QuestCompletion" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own quest completions" ON public."QuestCompletion";
DROP POLICY IF EXISTS "Users can insert their own quest completions" ON public."QuestCompletion";
DROP POLICY IF EXISTS "Users can update their own quest completions" ON public."QuestCompletion";
DROP POLICY IF EXISTS "Users can delete their own quest completions" ON public."QuestCompletion";

-- Create policies for QuestCompletion
-- Allow users to view their own quest completions
CREATE POLICY "Users can view their own quest completions"
    ON public."QuestCompletion"
    FOR SELECT
    USING (auth.uid() = "userId");

-- Allow users to insert their own quest completions
CREATE POLICY "Users can insert their own quest completions"
    ON public."QuestCompletion"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

-- Allow users to update their own quest completions
CREATE POLICY "Users can update their own quest completions"
    ON public."QuestCompletion"
    FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Allow users to delete their own quest completions
CREATE POLICY "Users can delete their own quest completions"
    ON public."QuestCompletion"
    FOR DELETE
    USING (auth.uid() = "userId"); 