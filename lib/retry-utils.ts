export interface RetryOptions {
  maxAttempts: number
  delayMs: number
  backoffMultiplier: number
  maxDelayMs: number
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...defaultRetryOptions, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === config.maxAttempts) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.delayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      )

      console.warn(`Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms:`, lastError.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export function createRetryableOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
) {
  return () => retry(operation, options)
}

// Utility for operations that should be retried with different strategies
export class RetryManager {
  private static instance: RetryManager

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager()
    }
    return RetryManager.instance
  }

  // For network operations
  async retryNetwork<T>(operation: () => Promise<T>): Promise<T> {
    return retry(operation, {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 5000
    })
  }

  // For database operations
  async retryDatabase<T>(operation: () => Promise<T>): Promise<T> {
    return retry(operation, {
      maxAttempts: 5,
      delayMs: 500,
      backoffMultiplier: 1.5,
      maxDelayMs: 3000
    })
  }

  // For critical operations
  async retryCritical<T>(operation: () => Promise<T>): Promise<T> {
    return retry(operation, {
      maxAttempts: 10,
      delayMs: 200,
      backoffMultiplier: 1.2,
      maxDelayMs: 2000
    })
  }

  // For operations that should fail fast
  async retryFast<T>(operation: () => Promise<T>): Promise<T> {
    return retry(operation, {
      maxAttempts: 2,
      delayMs: 100,
      backoffMultiplier: 1,
      maxDelayMs: 100
    })
  }
} 