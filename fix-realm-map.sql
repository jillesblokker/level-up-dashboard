-- This SQL fixes the missing userId column in RealmMap table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'RealmMap' AND column_name = 'userId'
  ) THEN
    -- First drop constraints if they exist
    ALTER TABLE IF EXISTS "RealmMap" DROP CONSTRAINT IF EXISTS "RealmMap_userId_fkey";
    DROP INDEX IF EXISTS "RealmMap_userId_key";
    
    -- Then add column
    ALTER TABLE "RealmMap" ADD COLUMN "userId" TEXT;
    
    -- Create index and constraint
    CREATE UNIQUE INDEX "RealmMap_userId_key" ON "RealmMap"("userId");
    ALTER TABLE "RealmMap" ADD CONSTRAINT "RealmMap_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
