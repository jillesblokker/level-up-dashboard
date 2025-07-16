// StorageService is now deprecated. All persistence is handled by Supabase.
export const storageService = {
  get: () => undefined,
  set: () => {},
  getAllKeys: () => [],
  getStorageInfo: () => ({}),
  getStats: () => ({}),
  clear: () => {},
  restore: () => false,
}; 