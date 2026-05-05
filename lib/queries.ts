/**
 * Shared React Query hooks for frequently-fetched server data.
 * By centralising queries here every component that calls these hooks
 * automatically shares the same cache entry — zero duplicate network requests.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ─── Query keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  inventory: ["inventory"] as const,
  characterStats: ["character-stats"] as const,
}

// ─── Inventory ─────────────────────────────────────────────────────────────────

async function fetchInventory() {
  const res = await fetch("/api/inventory", { credentials: "include" })
  if (!res.ok) throw new Error(`Inventory fetch failed: ${res.status}`)
  return res.json()
}

export function useInventory() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory,
    queryFn: fetchInventory,
    // Serve stale data instantly while revalidating in background
    placeholderData: (prev) => prev,
  })
}

// ─── Character stats ────────────────────────────────────────────────────────────

async function fetchCharacterStats() {
  const res = await fetch("/api/character-stats", { credentials: "include" })
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`)
  return res.json()
}

export function useCharacterStats() {
  return useQuery({
    queryKey: QUERY_KEYS.characterStats,
    queryFn: fetchCharacterStats,
    placeholderData: (prev) => prev,
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────────

/** Update character stats and automatically invalidate the cached stats. */
export function useUpdateCharacterStats() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stats: Record<string, unknown>) => {
      const res = await fetch("/api/character-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
        credentials: "include",
      })
      if (!res.ok) throw new Error(`Stats update failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characterStats })
    },
  })
}

/** Add an item to inventory and refresh the cache. */
export function useAddInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
        credentials: "include",
      })
      if (!res.ok) throw new Error(`Inventory add failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory })
    },
  })
}
