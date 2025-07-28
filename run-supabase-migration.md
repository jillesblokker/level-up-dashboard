# Supabase Migration Guide

## Step 1: Run the Database Migration

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration SQL**
   - Copy the contents of `supabase-migration.sql`
   - Paste it into the SQL editor

4. **Execute the Migration**
   - Click "Run" to execute the SQL
   - You should see success messages for each table creation

## Step 2: Verify the Tables Were Created

1. **Check Tables in Supabase**
   - Go to "Table Editor" in the left sidebar
   - You should see these new tables:
     - `character_stats`
     - `active_perks`
     - `game_settings`

2. **Verify RLS Policies**
   - Click on each table
   - Go to "Authentication" tab
   - Verify RLS is enabled and policies are created

## Step 3: Test the Migration System

1. **Go to the Stored Data Page**
   - Navigate to: `/account/stored-data`
   - You should see the migration status

2. **Test Migration**
   - Click "Test Migration" button
   - Check the console for any errors
   - Verify data appears in "Supabase Data" section

## Step 4: Perform Full Migration

1. **Run Full Migration**
   - Click "Migrate to Supabase" button
   - Wait for completion
   - Verify all data is transferred

2. **Verify Data in Supabase**
   - Go back to Supabase Table Editor
   - Check that data appears in the new tables

## Troubleshooting

If you encounter any errors:
1. Check the browser console for error messages
2. Verify your Supabase connection is working
3. Ensure all environment variables are set correctly
4. Check that RLS policies are properly configured 