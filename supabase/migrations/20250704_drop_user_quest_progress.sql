-- Migration to drop user_quest_progress if it exists
DROP TABLE IF EXISTS user_quest_progress CASCADE;
