"use client"

import { useState, useEffect } from 'react'
import { Tile } from '@/types/tiles'

function createInitialTile(x: number, y: number): Tile {
  return {
    id: `tile-${x}-${y}`,
    type: 'grass',
    connections: [],
    rotation: 0,
    revealed: false,
    isDiscovered: false,
    x,
    y
  }
}

export const initialGrid = [
  [createInitialTile(0, 0), createInitialTile(1, 0), createInitialTile(2, 0)],
  [createInitialTile(0, 1), createInitialTile(1, 1), createInitialTile(2, 1)],
  [createInitialTile(0, 2), createInitialTile(1, 2), createInitialTile(2, 2)]
]

export function useRealmMap() {
  const [grid, setGrid] = useState<Tile[][]>(initialGrid)
  const [isLoading, setIsLoading] = useState(true)

  // Load grid from database on mount
  useEffect(() => {
    let isMounted = true

    async function loadGrid() {
      try {
        const response = await fetch('/api/game-data')
        if (!response.ok) {
          throw new Error('Failed to fetch realm map')
        }
        const data = await response.json()
        
        if (isMounted && data.realmMap?.grid) {
          setGrid(data.realmMap.grid)
        }
      } catch (error) {
        console.error('Error loading realm map:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadGrid()
    return () => {
      isMounted = false
    }
  }, [])

  // Save grid to database whenever it changes
  useEffect(() => {
    if (isLoading) return // Don't save while initial loading

    const saveTimeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/game-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            realmMap: {
              grid
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save realm map')
        }
      } catch (error) {
        console.error('Error saving realm map:', error)
      }
    }, 500) // Debounce saves to prevent too many requests

    return () => {
      clearTimeout(saveTimeout)
    }
  }, [grid, isLoading])

  return {
    grid,
    setGrid,
    isLoading
  }
} 