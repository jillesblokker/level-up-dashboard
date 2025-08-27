'use client';

import { useEffect, useState } from 'react';
import { migrateLocalStorageToSupabase } from '@/lib/user-preferences-manager';
import { migrateRealmDataToSupabase } from '@/lib/realm-data-manager';
import { migrateCharacterDataToSupabase } from '@/lib/character-data-manager';
import { migrateKingdomDataToSupabase } from '@/lib/kingdom-data-manager';

export default function LocalStorageMigrator() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<string>('');

  useEffect(() => {
    const performMigration = async () => {
      const migrationDone = localStorage.getItem('supabase-migration-complete');
      if (migrationDone) {
        setMigrationComplete(true);
        return;
      }

      setIsMigrating(true);
      try {
        console.log('[LocalStorage Migrator] 🚀 Starting comprehensive migration...');
        
        // Phase 1: User Preferences
        setMigrationProgress('Migrating user preferences...');
        await migrateLocalStorageToSupabase();
        
        // Phase 2: Realm Data
        setMigrationProgress('Migrating realm data...');
        await migrateRealmDataToSupabase();
        
        // Phase 3: Character Data
        setMigrationProgress('Migrating character data...');
        await migrateCharacterDataToSupabase();
        
        // Phase 4: Kingdom Data
        setMigrationProgress('Migrating kingdom data...');
        await migrateKingdomDataToSupabase();
        
        localStorage.setItem('supabase-migration-complete', 'true');
        setMigrationComplete(true);
        setMigrationProgress('Migration completed successfully!');
        console.log('[LocalStorage Migrator] ✅ Comprehensive migration completed successfully');
      } catch (error) {
        console.error('[LocalStorage Migrator] ❌ Migration failed:', error);
        setMigrationProgress('Migration failed. Check console for details.');
      } finally {
        setIsMigrating(false);
      }
    };

    const timer = setTimeout(performMigration, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
