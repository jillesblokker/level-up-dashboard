-- Fix rare_tiles table sequence permissions
-- First, let's find the correct sequence name and fix permissions

-- Get the sequence name for the rare_tiles table
DO $$
DECLARE
    seq_name text;
BEGIN
    -- Find the sequence name for the rare_tiles table
    SELECT pg_get_serial_sequence('rare_tiles', 'id') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
        -- Grant permissions to the service role for the sequence
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO service_role', seq_name);
        
        -- Grant all permissions on the rare_tiles table to service_role
        GRANT ALL PRIVILEGES ON TABLE rare_tiles TO service_role;
        
        -- Grant permissions to authenticated users for RLS to work
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rare_tiles TO authenticated;
        
        -- Ensure the sequence is owned by the correct role
        EXECUTE format('ALTER SEQUENCE %I OWNER TO postgres', seq_name);
        
        -- Grant sequence permissions to authenticated users as well
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO authenticated', seq_name);
        
        RAISE NOTICE 'Fixed permissions for sequence: %', seq_name;
    ELSE
        RAISE NOTICE 'No sequence found for rare_tiles table';
    END IF;
END $$; 