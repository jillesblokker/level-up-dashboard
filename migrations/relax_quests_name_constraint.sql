-- Relax constraint on 'name' column in quests table
-- This allows the API to function even if it only sends 'title' initially (though code is now updated to send both)

ALTER TABLE quests ALTER COLUMN name DROP NOT NULL;
