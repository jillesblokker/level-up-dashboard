import { cachedFetch, invalidateCache, clearCache, getCacheStats } from '@/lib/fetch-cache';

describe('Fetch Cache', () => {
    beforeEach(() => {
        // Clear cache before each test
        clearCache();
    });

    describe('cachedFetch', () => {
        it('should call fetcher on first request', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            const result = await cachedFetch('test-key', fetcher);

            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: 'test' });
        });

        it('should return cached data on subsequent requests', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cachedFetch('test-key', fetcher);
            const result = await cachedFetch('test-key', fetcher);

            expect(fetcher).toHaveBeenCalledTimes(1); // Only called once!
            expect(result).toEqual({ data: 'test' });
        });

        it('should force refresh when option is set', async () => {
            const fetcher = jest.fn()
                .mockResolvedValueOnce({ data: 'old' })
                .mockResolvedValueOnce({ data: 'new' });

            await cachedFetch('test-key', fetcher);
            const result = await cachedFetch('test-key', fetcher, { forceRefresh: true });

            expect(fetcher).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ data: 'new' });
        });

        it('should deduplicate concurrent requests', async () => {
            let resolvePromise: (value: any) => void;
            const slowFetcher = jest.fn().mockImplementation(() =>
                new Promise(resolve => { resolvePromise = resolve; })
            );

            // Start two concurrent requests
            const promise1 = cachedFetch('test-key', slowFetcher);
            const promise2 = cachedFetch('test-key', slowFetcher);

            // Fetcher should only be called once
            expect(slowFetcher).toHaveBeenCalledTimes(1);

            // Resolve the promise
            resolvePromise!({ data: 'test' });

            // Both should get the same result
            const [result1, result2] = await Promise.all([promise1, promise2]);
            expect(result1).toEqual({ data: 'test' });
            expect(result2).toEqual({ data: 'test' });
        });
    });

    describe('invalidateCache', () => {
        it('should remove specific cache entry', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cachedFetch('test-key', fetcher);
            invalidateCache('test-key');
            await cachedFetch('test-key', fetcher);

            expect(fetcher).toHaveBeenCalledTimes(2);
        });
    });

    describe('getCacheStats', () => {
        it('should report correct cache size', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cachedFetch('key1', fetcher);
            await cachedFetch('key2', fetcher);

            const stats = getCacheStats();
            expect(stats.size).toBe(2);
            expect(stats.keys).toContain('key1');
            expect(stats.keys).toContain('key2');
        });
    });
});
