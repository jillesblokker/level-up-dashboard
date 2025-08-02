-- Fix permissions for rare_tiles table and the correct sequence name
-- Grant permissions to the service role for the sequence
GRANT USAGE, SELECT ON SEQUENCE rare_tiles_new_id_seq TO service_role;

-- Grant all permissions on the rare_tiles table to service_role
GRANT ALL PRIVILEGES ON TABLE rare_tiles TO service_role;

-- Grant permissions to authenticated users for RLS to work
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rare_tiles TO authenticated;

-- Ensure the sequence is owned by the correct role
ALTER SEQUENCE rare_tiles_new_id_seq OWNER TO postgres;

-- Grant sequence permissions to authenticated users as well
GRANT USAGE, SELECT ON SEQUENCE rare_tiles_new_id_seq TO authenticated; 