export class StorageService {
  private static instance: StorageService;
  private storage: Storage;
  private version: string = '1.0.0';
  private readonly VERSION_KEY = 'storage-version';
  private readonly ENCRYPTION_KEY = 'your-encryption-key'; // In production, use a secure key management system
  private readonly MIGRATIONS: Record<string, (data: any) => any> = {
    '1.0.0': (data) => data, // Initial version
    '1.1.0': (data) => {
      // Example migration: Add a new field to all items
      if (data && typeof data === 'object') {
        return {
          ...data,
          migrated: true
        };
      }
      return data;
    }
  };

  private constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    };
    this.initializeVersion();
  }

  private initializeVersion() {
    const currentVersion = this.get<string>(this.VERSION_KEY, this.version);
    if (currentVersion !== this.version) {
      this.handleVersionChange(currentVersion);
    }
  }

  private handleVersionChange(oldVersion: string) {
    console.log(`Storage version changed from ${oldVersion} to ${this.version}`);
    // Apply migrations in order
    const versions = Object.keys(this.MIGRATIONS).sort();
    const startIndex = versions.indexOf(oldVersion);
    const endIndex = versions.indexOf(this.version);
    if (startIndex !== -1 && endIndex !== -1) {
      for (let i = startIndex + 1; i <= endIndex; i++) {
        const version = versions[i];
        if (version && this.MIGRATIONS[version]) {
          const migration = this.MIGRATIONS[version];
          // Apply migration to all items
          const keys = this.getAllKeys();
          keys.forEach(key => {
            if (key !== this.VERSION_KEY) {
              const item = this.get<any>(key, null);
              if (item) {
                const migratedItem = migration(item);
                this.set(key, migratedItem);
              }
            }
          });
        }
      }
    }
    this.set(this.VERSION_KEY, this.version);
  }

  private validateData<T>(data: T): boolean {
    try {
      // Basic validation: ensure data is serializable
      JSON.stringify(data);
      return true;
    } catch (error) {
      console.error('Data validation failed:', error);
      return false;
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private compress(data: string): string {
    try {
      // Simple compression by removing whitespace and using shorter property names
      return JSON.stringify(JSON.parse(data));
    } catch (error) {
      console.error('Error compressing data:', error);
      return data;
    }
  }

  private decompress(data: string): string {
    try {
      // Decompression is just parsing and stringifying to ensure valid JSON
      return JSON.stringify(JSON.parse(data));
    } catch (error) {
      console.error('Error decompressing data:', error);
      return data;
    }
  }

  private encrypt(data: string): string {
    try {
      // Simple XOR encryption for demonstration
      // In production, use a proper encryption library
      return btoa(data.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length))
      ).join(''));
    } catch (error) {
      console.error('Error encrypting data:', error);
      return data;
    }
  }

  private decrypt(data: string): string {
    try {
      // Simple XOR decryption for demonstration
      // In production, use a proper encryption library
      return atob(data).split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length))
      ).join('');
    } catch (error) {
      // If atob fails, assume data is not encrypted and return as-is
      return data;
    }
  }

  public get<T>(key: string, defaultValue: T): T {
    try {
      const item = this.storage.getItem(key);
      if (!item) return defaultValue;
      const decrypted = this.decrypt(item);
      const decompressed = this.decompress(decrypted);
      const parsed = JSON.parse(decompressed) as T;
      return this.validateData(parsed) ? parsed : defaultValue;
    } catch (error) {
      console.warn(`Corrupted or invalid data detected for key '${key}'. Removing key and returning default.`, error);
      this.remove(key);
      return defaultValue;
    }
  }

  public set<T>(key: string, value: T): void {
    try {
      if (!this.validateData(value)) {
        throw new Error('Invalid data format');
      }
      const dataToStore = {
        value,
        lastUpdated: new Date().toISOString(),
        version: this.version
      };
      const stringified = JSON.stringify(dataToStore);
      const compressed = this.compress(stringified);
      const encrypted = this.encrypt(compressed);
      this.storage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
      // If storage is full, try to clear old data
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleStorageFull();
      }
    }
  }

  private handleStorageFull() {
    try {
      // Get all keys
      const keys = Object.keys(this.storage);
      // Sort by last updated time
      const sortedKeys = keys
        .map(key => {
          try {
            const item = this.storage.getItem(key);
            if (item) {
              const decrypted = this.decrypt(item);
              const parsed = JSON.parse(decrypted);
              return { key, lastUpdated: parsed.lastUpdated || 0 };
            }
          } catch (error) { /* intentionally empty */ }
          return { key, lastUpdated: 0 };
        })
        .filter((item): item is { key: string; lastUpdated: number } => item.key !== undefined)
        .sort((a, b) => a.lastUpdated - b.lastUpdated);

      // Remove oldest 20% of items
      const itemsToRemove = Math.ceil(sortedKeys.length * 0.2);
      for (let i = 0; i < itemsToRemove && i < sortedKeys.length; i++) {
        const item = sortedKeys[i];
        if (item) {
          this.storage.removeItem(item.key);
        }
      }
    } catch (error) {
      console.error('Error handling storage full:', error);
    }
  }

  public remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
    }
  }

  public clear(): void {
    try {
      this.storage.clear();
      // Re-initialize version after clear
      this.initializeVersion();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }

  public exists(key: string): boolean {
    try {
      return this.storage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage: ${key}`, error);
      return false;
    }
  }

  public getAllKeys(): string[] {
    try {
      return Object.keys(this.storage);
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  public getSize(): number {
    try {
      let total = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const value = this.storage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
      return total;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  public getStorageInfo(): { total: number; used: number; remaining: number } {
    try {
      const used = this.getSize();
      // Most browsers limit localStorage to 5-10 MB
      const total = 5 * 1024 * 1024; // 5MB
      return {
        total,
        used,
        remaining: total - used
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { total: 0, used: 0, remaining: 0 };
    }
  }

  public backup(): string {
    try {
      const backup: Record<string, any> = {};
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const value = this.storage.getItem(key);
          if (value) {
            backup[key] = value;
          }
        }
      }
      return JSON.stringify(backup);
    } catch (error) {
      console.error('Error creating backup:', error);
      return '{}';
    }
  }

  public restore(backup: string): boolean {
    try {
      const data = JSON.parse(backup);
      this.clear();
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          this.storage.setItem(key, value);
        }
      });
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  public getStats(): { 
    totalItems: number; 
    totalSize: number; 
    averageItemSize: number; 
    oldestItem: string | null; 
    newestItem: string | null; 
  } {
    try {
      const keys = this.getAllKeys();
      const items = keys.map(key => {
        const value = this.storage.getItem(key);
        if (value) {
          const decrypted = this.decrypt(value);
          const parsed = JSON.parse(decrypted);
          return {
            key,
            size: value.length,
            lastUpdated: parsed.lastUpdated || new Date(0).toISOString()
          };
        }
        return null;
      }).filter((item): item is { key: string; size: number; lastUpdated: string } => item !== null);

      const totalSize = items.reduce((sum, item) => sum + item.size, 0);
      const sortedByDate = [...items].sort((a, b) => 
        new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
      );

      return {
        totalItems: items.length,
        totalSize,
        averageItemSize: items.length ? totalSize / items.length : 0,
        oldestItem: sortedByDate[0]?.key || null,
        newestItem: sortedByDate[sortedByDate.length - 1]?.key || null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        averageItemSize: 0,
        oldestItem: null,
        newestItem: null
      };
    }
  }
}

export const storageService = StorageService.getInstance(); 