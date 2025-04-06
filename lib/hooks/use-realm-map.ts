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

const initialGrid = [
  [createInitialTile(0, 0), createInitialTile(1, 0), createInitialTile(2, 0)],
  [createInitialTile(0, 1), createInitialTile(1, 1), createInitialTile(2, 1)],
  [createInitialTile(0, 2), createInitialTile(1, 2), createInitialTile(2, 2)]
]

export function useRealmMap() {
  const [grid, setGrid] = useState<Tile[][]>(initialGrid)
  const [isLoading, setIsLoading] = useState(true)

  // Load grid from database on mount
  useEffect(() => {
    async function loadGrid() {
      try {
        const response = await fetch('/api/game-data')
        const data = await response.json()
        
        if (data.realmMap?.grid) {
          setGrid(data.realmMap.grid)
        }
      } catch (error) {
        console.error('Error loading realm map:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGrid()
  }, [])

  // Save grid to database whenever it changes
  useEffect(() => {
    if (isLoading) return // Don't save while initial loading

    async function saveGrid() {
      try {
        await fetch('/api/game-data', {
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
      } catch (error) {
        console.error('Error saving realm map:', error)
      }
    }

    saveGrid()
  }, [grid, isLoading])

  return {
    grid,
    setGrid,
    isLoading
  }
} 