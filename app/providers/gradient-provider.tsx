"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager'

interface GradientContextType {
  startColor: string
  endColor: string
  updateGradient: (start: string, end: string) => void
}

const GradientContext = createContext<GradientContextType | undefined>(undefined)

export function GradientProvider({ children }: { children: React.ReactNode }) {
  const [startColor, setStartColor] = useState('#000428')
  const [endColor, setEndColor] = useState('#004e92')

  useEffect(() => {
    // Load saved gradient from Supabase with localStorage fallback
    const loadGradient = async () => {
      try {
        // Try to load from Supabase first
        const savedGradient = await getUserPreference('app-gradient')
        if (savedGradient) {
          const { start, end } = typeof savedGradient === 'string' ? JSON.parse(savedGradient) : savedGradient
          setStartColor(start)
          setEndColor(end)
          return
        }
      } catch (error) {
        console.warn('[Gradient Provider] Failed to load from Supabase:', error)
      }

      // Fallback to localStorage
      try {
        const savedGradient = localStorage.getItem('app-gradient')
        if (savedGradient) {
          const { start, end } = JSON.parse(savedGradient)
          setStartColor(start)
          setEndColor(end)
        }
      } catch (error) {
        console.warn('[Gradient Provider] Failed to load from localStorage:', error)
      }
    }

    loadGradient()
  }, [])

  useEffect(() => {
    // Update CSS variables when gradient changes
    document.documentElement.style.setProperty('--card-gradient-start', startColor)
    document.documentElement.style.setProperty('--card-gradient-end', endColor)
  }, [startColor, endColor])

  const updateGradient = async (start: string, end: string) => {
    setStartColor(start)
    setEndColor(end)
    
    // Save to Supabase
    try {
      await setUserPreference('app-gradient', { start, end })
    } catch (error) {
      console.warn('[Gradient Provider] Failed to save to Supabase:', error)
    }
    
    // Save to localStorage as backup
    try {
      localStorage.setItem('app-gradient', JSON.stringify({ start, end }))
    } catch (error) {
      console.warn('[Gradient Provider] Failed to save to localStorage:', error)
    }
  }

  return (
    <GradientContext.Provider value={{ startColor, endColor, updateGradient }}>
      {children}
    </GradientContext.Provider>
  )
}

export const useGradient = () => {
  const context = useContext(GradientContext)
  if (context === undefined) {
    throw new Error('useGradient must be used within a GradientProvider')
  }
  return context
} 