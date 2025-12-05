-- Create smart_quest_completion function to handle atomic updates
CREATE OR REPLACE FUNCTION smart_quest_completion(
    p_user_id text,
    p_quest_id uuid, -- Changed to uuid to match quests.id confirmed from logs
    p_completed boolean,
    p_xp_reward int DEFAULT 0,
    p_gold_reward int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_completion_record record;
    v_old_completed boolean;
    v_result jsonb;
BEGIN
    -- Check strict foreign key if needed, or just upsert into quest_completion
    
    -- Check existing status
    SELECT completed INTO v_old_completed
    FROM quest_completion
    WHERE user_id = p_user_id AND quest_id = p_quest_id;

    -- Upsert completion status
    INSERT INTO quest_completion (user_id, quest_id, completed, completed_at)
    VALUES (p_user_id, p_quest_id, p_completed, CASE WHEN p_completed THEN NOW() ELSE NULL END)
    ON CONFLICT (user_id, quest_id)
    DO UPDATE SET
        completed = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at
    RETURNING * INTO v_completion_record;

    -- Handle Rewards (only if changing from false/null -> true)
    IF p_completed AND (v_old_completed IS NULL OR v_old_completed = false) THEN
        UPDATE character_stats
        SET experience = experience + p_xp_reward,
            gold = gold + p_gold_reward
        WHERE user_id = p_user_id;
    END IF;

    -- Handle Revoking Rewards (if changing true -> false)
    IF NOT p_completed AND v_old_completed = true THEN
         UPDATE character_stats
        SET experience = GREATEST(0, experience - p_xp_reward),
            gold = GREATEST(0, gold - p_gold_reward)
        WHERE user_id = p_user_id;
    END IF;

    v_result := jsonb_build_object(
        'success', true,
        'record', row_to_json(v_completion_record)
    );

    RETURN v_result;
END;
$$;
