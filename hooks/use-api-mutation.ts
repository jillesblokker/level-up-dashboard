"use client"

import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'

type MutationStatus = 'idle' | 'loading' | 'success' | 'error'

interface MutationOptions<TData, TVariables> {
    // Called when mutation succeeds
    onSuccess?: (data: TData, variables: TVariables) => void
    // Called when mutation fails
    onError?: (error: Error, variables: TVariables) => void
    // Called when mutation completes (success or error)
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void
    // Show toast on success
    successMessage?: string | ((data: TData) => string)
    // Show toast on error
    errorMessage?: string | ((error: Error) => string)
    // Enable optimistic updates
    optimisticUpdate?: (variables: TVariables) => void
    // Rollback function for failed optimistic updates
    rollback?: (variables: TVariables) => void
}

interface MutationResult<TData, TVariables> {
    mutate: (variables: TVariables) => Promise<TData | undefined>
    mutateAsync: (variables: TVariables) => Promise<TData>
    status: MutationStatus
    isLoading: boolean
    isSuccess: boolean
    isError: boolean
    isIdle: boolean
    data: TData | undefined
    error: Error | null
    reset: () => void
}

/**
 * Custom hook for API mutations with consistent error handling,
 * loading states, and toast notifications.
 * 
 * @example
 * const completeQuest = useApiMutation(
 *   async (questId: string) => {
 *     const res = await fetch(`/api/quests/${questId}/complete`, { method: 'POST' })
 *     if (!res.ok) throw new Error('Failed to complete quest')
 *     return res.json()
 *   },
 *   {
 *     onSuccess: () => refetchQuests(),
 *     successMessage: 'Quest completed!',
 *     errorMessage: 'Failed to complete quest'
 *   }
 * )
 */
export function useApiMutation<TData = unknown, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
    const [status, setStatus] = useState<MutationStatus>('idle')
    const [data, setData] = useState<TData | undefined>(undefined)
    const [error, setError] = useState<Error | null>(null)

    const reset = useCallback(() => {
        setStatus('idle')
        setData(undefined)
        setError(null)
    }, [])

    const mutateAsync = useCallback(
        async (variables: TVariables): Promise<TData> => {
            setStatus('loading')
            setError(null)

            // Apply optimistic update if provided
            if (options.optimisticUpdate) {
                options.optimisticUpdate(variables)
            }

            try {
                const result = await mutationFn(variables)
                setData(result)
                setStatus('success')

                // Success callback
                if (options.onSuccess) {
                    options.onSuccess(result, variables)
                }

                // Success toast
                if (options.successMessage) {
                    const message = typeof options.successMessage === 'function'
                        ? options.successMessage(result)
                        : options.successMessage
                    toast({
                        title: 'Success',
                        description: message,
                    })
                }

                // Settled callback
                if (options.onSettled) {
                    options.onSettled(result, null, variables)
                }

                return result
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err))
                setError(error)
                setStatus('error')

                // Rollback optimistic update
                if (options.rollback) {
                    options.rollback(variables)
                }

                // Error callback
                if (options.onError) {
                    options.onError(error, variables)
                }

                // Error toast
                const errorMessage = options.errorMessage
                    ? (typeof options.errorMessage === 'function'
                        ? options.errorMessage(error)
                        : options.errorMessage)
                    : error.message

                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive',
                })

                logger.error('API mutation failed', { error: error.message })

                // Settled callback
                if (options.onSettled) {
                    options.onSettled(undefined, error, variables)
                }

                throw error
            }
        },
        [mutationFn, options]
    )

    const mutate = useCallback(
        async (variables: TVariables): Promise<TData | undefined> => {
            try {
                return await mutateAsync(variables)
            } catch {
                // Error already handled in mutateAsync
                return undefined
            }
        },
        [mutateAsync]
    )

    return {
        mutate,
        mutateAsync,
        status,
        isLoading: status === 'loading',
        isSuccess: status === 'success',
        isError: status === 'error',
        isIdle: status === 'idle',
        data,
        error,
        reset,
    }
}

/**
 * Hook for fetching data with loading and error states
 */
export function useApiFetch<TData>(
    fetchFn: () => Promise<TData>,
    deps: React.DependencyList = []
) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [data, setData] = useState<TData | undefined>(undefined)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
        setStatus('loading')
        setError(null)

        try {
            const result = await fetchFn()
            setData(result)
            setStatus('success')
            return result
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            setStatus('error')
            logger.error('API fetch failed', { error: error.message })
            throw error
        }
    }, [fetchFn])

    // Auto-fetch on mount and when deps change
    // Using useEffect would cause issues with deps array
    // Consumers should call refetch() as needed

    return {
        data,
        error,
        status,
        isLoading: status === 'loading',
        isSuccess: status === 'success',
        isError: status === 'error',
        refetch,
    }
}

/**
 * Common fetch wrapper with auth and error handling
 */
export async function apiFetch<T = unknown>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`)
    }

    return response.json()
}
