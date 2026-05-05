"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Create a stable QueryClient instance per browser session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 5 minutes before background refetch
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Don't retry on 401 / 403 — avoids hammering the auth circuit breaker
            retry: (failureCount, error: unknown) => {
              if (error instanceof Error && error.message.includes("401")) return false
              if (error instanceof Error && error.message.includes("403")) return false
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
