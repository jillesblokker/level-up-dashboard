#!/bin/bash

# Run database migration for user_preferences and realm_data tables
# This script should be run once to create the missing tables

echo "Running database migration..."
echo "Creating user_preferences and realm_data tables..."

# You need to run this SQL in your Supabase SQL Editor:
# 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
# 2. Copy and paste the contents of migrations/create_user_preferences_and_realm_data.sql
# 3. Click "Run"

echo ""
echo "⚠️  IMPORTANT: Run this migration manually in Supabase:"
echo ""
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Run the migration file: migrations/create_user_preferences_and_realm_data.sql"
echo ""
echo "Migration file location:"
echo "$(pwd)/migrations/create_user_preferences_and_realm_data.sql"
echo ""
