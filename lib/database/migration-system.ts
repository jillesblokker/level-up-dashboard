import { supabaseServer } from '@/lib/supabase/server-client';

export interface Migration {
  version: number;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  dependencies?: number[];
}

export interface MigrationRecord {
  id: string;
  version: number;
  name: string;
  applied_at: string;
  checksum: string;
  execution_time_ms: number;
}

export class DatabaseMigrationSystem {
  private static instance: DatabaseMigrationSystem;
  private migrations: Migration[] = [];
  private isInitialized = false;

  static getInstance(): DatabaseMigrationSystem {
    if (!DatabaseMigrationSystem.instance) {
      DatabaseMigrationSystem.instance = new DatabaseMigrationSystem();
    }
    return DatabaseMigrationSystem.instance;
  }

  private constructor() {
    this.initializeMigrations();
  }

  private initializeMigrations() {
    if (this.isInitialized) return;

    // Define all migrations in order
    this.migrations = [
      {
        version: 1,
        name: 'Add missing columns to quest_completion',
        description: 'Add xp_earned, gold_earned, and original_completion_date columns',
        up: async () => {
          const { error } = await supabaseServer.rpc('add_missing_columns_to_quest_completion');
          if (error) throw error;
        },
        down: async () => {
          // Remove columns (be careful with this in production)
          const { error } = await supabaseServer.rpc('remove_columns_from_quest_completion');
          if (error) throw error;
        },
      },
      {
        version: 2,
        name: 'Create performance indexes',
        description: 'Add performance indexes for better query performance',
        up: async () => {
          const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_quest_completion_user_date ON quest_completion(user_id, completed_at)',
            'CREATE INDEX IF NOT EXISTS idx_quest_completion_quest_id ON quest_completion(quest_id)',
            'CREATE INDEX IF NOT EXISTS idx_quest_completion_completed ON quest_completion(completed, completed_at)',
            'CREATE INDEX IF NOT EXISTS idx_quest_completion_active ON quest_completion(user_id, quest_id) WHERE completed = false',
          ];

          for (const indexSql of indexes) {
            const { error } = await supabaseServer.rpc('exec_sql', { sql: indexSql });
            if (error) throw error;
          }
        },
        down: async () => {
          const indexes = [
            'DROP INDEX IF EXISTS idx_quest_completion_user_date',
            'DROP INDEX IF EXISTS idx_quest_completion_quest_id',
            'DROP INDEX IF EXISTS idx_quest_completion_completed',
            'DROP INDEX IF EXISTS idx_quest_completion_active',
          ];

          for (const indexSql of indexes) {
            const { error } = await supabaseServer.rpc('exec_sql', { sql: indexSql });
            if (error) throw error;
          }
        },
      },
      {
        version: 3,
        name: 'Add data validation constraints',
        description: 'Add constraints for data integrity',
        up: async () => {
          const constraints = [
            {
              name: 'valid_completion_date',
              sql: 'ALTER TABLE quest_completion ADD CONSTRAINT valid_completion_date CHECK (completed_at <= NOW())',
            },
            {
              name: 'positive_rewards',
              sql: 'ALTER TABLE quest_completion ADD CONSTRAINT positive_rewards CHECK (COALESCE(xp_earned, 0) >= 0 AND COALESCE(gold_earned, 0) >= 0)',
            },
          ];

          for (const constraint of constraints) {
            try {
              const { error } = await supabaseServer.rpc('exec_sql', { sql: constraint.sql });
              if (error) {
                console.warn(`Constraint ${constraint.name} might already exist:`, error.message);
              }
            } catch (error) {
              console.warn(`Constraint ${constraint.name} setup failed:`, error);
            }
          }
        },
        down: async () => {
          const constraints = [
            'ALTER TABLE quest_completion DROP CONSTRAINT IF EXISTS valid_completion_date',
            'ALTER TABLE quest_completion DROP CONSTRAINT IF EXISTS positive_rewards',
          ];

          for (const constraintSql of constraints) {
            const { error } = await supabaseServer.rpc('exec_sql', { sql: constraintSql });
            if (error) throw error;
          }
        },
      },
      {
        version: 4,
        name: 'Create user_preferences table if not exists',
        description: 'Ensure user_preferences table exists with proper structure',
        up: async () => {
          const createTableSql = `
            CREATE TABLE IF NOT EXISTS user_preferences (
              id SERIAL PRIMARY KEY,
              user_id TEXT NOT NULL,
              preference_key TEXT NOT NULL,
              preference_value JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, preference_key)
            );
          `;

          const { error } = await supabaseServer.rpc('exec_sql', { sql: createTableSql });
          if (error) throw error;

          // Create indexes
          const indexSql = `
            CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);
          `;

          const { error: indexError } = await supabaseServer.rpc('exec_sql', { sql: indexSql });
          if (indexError) throw indexError;
        },
        down: async () => {
          const { error } = await supabaseServer.rpc('exec_sql', { 
            sql: 'DROP TABLE IF EXISTS user_preferences CASCADE' 
          });
          if (error) throw error;
        },
      },
    ];

    this.isInitialized = true;
  }

  async getCurrentVersion(): Promise<number> {
    try {
      // Check if migrations table exists
      const { data: tableExists } = await supabaseServer
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'migrations')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        // Create migrations table
        await this.createMigrationsTable();
        return 0;
      }

      // Get highest applied version
      const { data: migrations, error } = await supabaseServer
        .from('migrations')
        .select('version')
        .order('version', { ascending: false })
        .limit(1);

      if (error) throw error;
      return migrations && migrations.length > 0 ? migrations[0].version : 0;
    } catch (error) {
      console.error('Error getting current migration version:', error);
      return 0;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT,
        execution_time_ms INTEGER,
        UNIQUE(version)
      );
    `;

    const { error } = await supabaseServer.rpc('exec_sql', { sql: createTableSql });
    if (error) throw error;
  }

  async migrate(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const target = targetVersion ?? Math.max(...this.migrations.map(m => m.version));

    console.log(`🔄 Starting migration from version ${currentVersion} to ${target}`);

    if (target > currentVersion) {
      // Migrate forward
      await this.migrateUp(currentVersion, target);
    } else if (target < currentVersion) {
      // Migrate backward (rollback)
      await this.migrateDown(currentVersion, target);
    } else {
      console.log('✅ Database is already at target version');
    }
  }

  private async migrateUp(fromVersion: number, toVersion: number): Promise<void> {
    const migrationsToRun = this.migrations
      .filter(m => m.version > fromVersion && m.version <= toVersion)
      .sort((a, b) => a.version - b.version);

    for (const migration of migrationsToRun) {
      await this.runMigration(migration, 'up');
    }
  }

  private async migrateDown(fromVersion: number, toVersion: number): Promise<void> {
    const migrationsToRollback = this.migrations
      .filter(m => m.version <= fromVersion && m.version > toVersion)
      .sort((a, b) => b.version - a.version);

    for (const migration of migrationsToRollback) {
      await this.runMigration(migration, 'down');
    }
  }

  private async runMigration(migration: Migration, direction: 'up' | 'down'): Promise<void> {
    const startTime = Date.now();
    const operation = direction === 'up' ? 'Applying' : 'Rolling back';

    try {
      console.log(`${operation} migration ${migration.version}: ${migration.name}`);

      if (direction === 'up') {
        await migration.up();
        await this.recordMigration(migration, startTime);
      } else {
        await migration.down();
        await this.removeMigrationRecord(migration.version);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ ${operation} migration ${migration.version} completed in ${executionTime}ms`);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ ${operation} migration ${migration.version} failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  private async recordMigration(migration: Migration, startTime: number): Promise<void> {
    const executionTime = Date.now() - startTime;
    const checksum = this.calculateChecksum(migration);

    const { error } = await supabaseServer
      .from('migrations')
      .insert({
        version: migration.version,
        name: migration.name,
        description: migration.description,
        checksum,
        execution_time_ms: executionTime,
      });

    if (error) throw error;
  }

  private async removeMigrationRecord(version: number): Promise<void> {
    const { error } = await supabaseServer
      .from('migrations')
      .delete()
      .eq('version', version);

    if (error) throw error;
  }

  private calculateChecksum(migration: Migration): string {
    // Simple checksum based on migration content
    const content = `${migration.version}-${migration.name}-${migration.description}`;
    return btoa(content).slice(0, 16);
  }

  async getMigrationHistory(): Promise<MigrationRecord[]> {
    try {
      const { data, error } = await supabaseServer
        .from('migrations')
        .select('*')
        .order('version', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting migration history:', error);
      return [];
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const currentVersion = await this.getCurrentVersion();
    return this.migrations.filter(m => m.version > currentVersion);
  }

  async validateMigrations(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const currentVersion = await this.getCurrentVersion();

    // Check for missing migrations
    const appliedMigrations = await this.getMigrationHistory();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    for (const migration of this.migrations) {
      if (migration.version <= currentVersion && !appliedVersions.has(migration.version)) {
        errors.push(`Migration ${migration.version} (${migration.name}) is missing from database`);
      }
    }

    // Check for dependency issues
    for (const migration of this.migrations) {
      if (migration.dependencies) {
        for (const dep of migration.dependencies) {
          if (dep > currentVersion) {
            errors.push(`Migration ${migration.version} depends on ${dep} which hasn't been applied`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async reset(): Promise<void> {
    console.log('🔄 Resetting database to version 0');
    const currentVersion = await this.getCurrentVersion();
    await this.migrate(0);
    console.log('✅ Database reset completed');
  }

  async status(): Promise<{
    currentVersion: number;
    targetVersion: number;
    pendingCount: number;
    appliedCount: number;
    isValid: boolean;
  }> {
    const currentVersion = await this.getCurrentVersion();
    const targetVersion = Math.max(...this.migrations.map(m => m.version));
    const pendingMigrations = await this.getPendingMigrations();
    const appliedMigrations = await this.getMigrationHistory();
    const validation = await this.validateMigrations();

    return {
      currentVersion,
      targetVersion,
      pendingCount: pendingMigrations.length,
      appliedCount: appliedMigrations.length,
      isValid: validation.valid,
    };
  }
}

// Export singleton instance
export const migrationSystem = DatabaseMigrationSystem.getInstance();

// Helper function to run migrations
export async function runMigrations(targetVersion?: number): Promise<void> {
  try {
    await migrationSystem.migrate(targetVersion);
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Helper function to check migration status
export async function checkMigrationStatus() {
  return await migrationSystem.status();
}
