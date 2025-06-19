'use client'

import { create } from 'zustand'

interface LoadingState {
  isLoading: boolean
  message: string
  progress: number | undefined
  operations: Map<string, boolean>
}

interface LoadingActions {
  startLoading: (message?: string) => void
  stopLoading: () => void
  setProgress: (progress: number | undefined) => void
  startOperation: (operationId: string, message?: string) => void
  stopOperation: (operationId: string) => void
  isOperationRunning: (operationId: string) => boolean
}

export const useLoadingStore = create<LoadingState & LoadingActions>((set, get) => ({
  isLoading: false,
  message: '',
  progress: undefined,
  operations: new Map(),

  startLoading: (message = 'Loading...') => {
    set({ isLoading: true, message, progress: undefined })
  },

  stopLoading: () => {
    set({ isLoading: false, message: '', progress: undefined })
  },

  setProgress: (progress: number | undefined) => {
    set({ progress })
  },

  startOperation: (operationId: string, message?: string) => {
    const { operations } = get()
    const newOperations = new Map(operations)
    newOperations.set(operationId, true)
    
    set({ 
      operations: newOperations,
      isLoading: true,
      message: message || 'Operation in progress...'
    })
  },

  stopOperation: (operationId: string) => {
    const { operations } = get()
    const newOperations = new Map(operations)
    newOperations.delete(operationId)
    
    set({ 
      operations: newOperations,
      isLoading: newOperations.size > 0,
      message: newOperations.size > 0 ? 'Operations in progress...' : ''
    })
  },

  isOperationRunning: (operationId: string) => {
    return get().operations.has(operationId)
  }
}))

// Hook for components to use loading state
export function useLoading(operationId?: string) {
  const store = useLoadingStore()
  
  if (operationId) {
    return {
      isLoading: store.isOperationRunning(operationId),
      startLoading: (message?: string) => store.startOperation(operationId, message),
      stopLoading: () => store.stopOperation(operationId)
    }
  }
  
  return {
    isLoading: store.isLoading,
    message: store.message,
    progress: store.progress,
    startLoading: store.startLoading,
    stopLoading: store.stopLoading,
    setProgress: store.setProgress
  }
}

// Utility for async operations with loading state
export async function withLoading<T>(
  operation: () => Promise<T>,
  operationId: string,
  message?: string
): Promise<T> {
  const store = useLoadingStore.getState()
  
  try {
    store.startOperation(operationId, message)
    const result = await operation()
    return result
  } finally {
    store.stopOperation(operationId)
  }
}

// Utility for operations with progress tracking
export async function withProgress<T>(
  operation: (setProgress: (progress: number) => void) => Promise<T>,
  operationId: string,
  message?: string
): Promise<T> {
  const store = useLoadingStore.getState()
  
  try {
    store.startOperation(operationId, message)
    const result = await operation((progress) => {
      store.setProgress(progress)
    })
    return result
  } finally {
    store.stopOperation(operationId)
    store.setProgress(undefined)
  }
} 