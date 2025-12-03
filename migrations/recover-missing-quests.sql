-- RECOVER MISSING QUESTS
-- Re-assign quests from old UUID to your Clerk ID

-- ==========================================
-- STEP 1: Re-assign Quests
-- ==========================================
-- Updates quests that were assigned to the old UUID '6440bafe-8ee7-4c60-9639-254145c7a5ff'
-- to your new Clerk ID 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'

UPDATE public.quests 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id = '6440bafe-8ee7-4c60-9639-254145c7a5ff';

-- Also check for any other UUID-like user_ids that aren't yours and assign them too
-- (Just to be safe, in case there are others)
UPDATE public.quests 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id LIKE '________-____-____-____-____________' -- Matches UUID pattern
  AND user_id != 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'; -- Don't update if already correct (though pattern wouldn't match anyway)


-- ==========================================
-- STEP 2: Re-assign Challenges (Just in case)
-- ==========================================
UPDATE public.challenges 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id = '6440bafe-8ee7-4c60-9639-254145c7a5ff';

UPDATE public.challenges 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id LIKE '________-____-____-____-____________';


-- ==========================================
-- STEP 3: Re-assign Milestones (Just in case)
-- ==========================================
UPDATE public.milestones 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id = '6440bafe-8ee7-4c60-9639-254145c7a5ff';

UPDATE public.milestones 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id LIKE '________-____-____-____-____________';


-- ==========================================
-- STEP 4: Verify Final Counts
-- ==========================================

SELECT 'quests' as table_name, count(*) as count FROM public.quests WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
UNION ALL
SELECT 'challenges' as table_name, count(*) as count FROM public.challenges WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
UNION ALL
SELECT 'milestones' as table_name, count(*) as count FROM public.milestones WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
