-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerk_id" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
ON "users"
FOR SELECT
USING (
  auth.uid() = id
);

CREATE POLICY "Users can insert their own data"
ON "users"
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Users can update their own data"
ON "users"
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 