// Centralized polling service to manage all polling operations
// This reduces redundant API calls and provides better error handling

interface PollingConfig {
  interval: number;
  enabled: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

class PollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private lastEditTimes: Map<string, number> = new Map();
  private debounceTime = 3000; // 3 seconds

  // Start polling for a specific endpoint
  startPolling(
    key: string,
    fetchFn: () => Promise<any>,
    config: PollingConfig
  ) {
    // Clear existing interval if any
    this.stopPolling(key);

    if (!config.enabled) return;

    const interval = setInterval(async () => {
      try {
        // Check debounce
        const lastEditTime = this.lastEditTimes.get(key) || 0;
        const now = Date.now();
        const timeSinceLastEdit = now - lastEditTime;

        if (timeSinceLastEdit < this.debounceTime) {
          console.log(`[PollingService] Skipping poll for ${key} due to recent edit`);
          return;
        }

        console.log(`[PollingService] Polling ${key}...`);
        const data = await fetchFn();
        
        if (config.onSuccess) {
          config.onSuccess(data);
        }
      } catch (error) {
        console.error(`[PollingService] Error polling ${key}:`, error);
        if (config.onError) {
          config.onError(error as Error);
        }
      }
    }, config.interval);

    this.intervals.set(key, interval);
    console.log(`[PollingService] Started polling for ${key}`);
  }

  // Stop polling for a specific endpoint
  stopPolling(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
      console.log(`[PollingService] Stopped polling for ${key}`);
    }
  }

  // Set last edit time for debouncing
  setLastEditTime(key: string) {
    this.lastEditTimes.set(key, Date.now());
    console.log(`[PollingService] Set last edit time for ${key}`);
  }

  // Stop all polling
  stopAll() {
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
      console.log(`[PollingService] Stopped polling for ${key}`);
    });
    this.intervals.clear();
  }

  // Get active polling keys
  getActiveKeys(): string[] {
    return Array.from(this.intervals.keys());
  }
}

// Export singleton instance
export const pollingService = new PollingService();

// Helper function to create a polling config
export function createPollingConfig(
  interval: number,
  enabled: boolean = true,
  onSuccess?: (data: any) => void,
  onError?: (error: Error) => void
): PollingConfig {
  return {
    interval,
    enabled,
    onSuccess,
    onError,
  };
}