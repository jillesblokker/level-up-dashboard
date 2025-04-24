"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

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
    // Load saved gradient from localStorage
    const savedGradient = localStorage.getItem('app-gradient')
    if (savedGradient) {
      const { start, end } = JSON.parse(savedGradient)
      setStartColor(start)
      setEndColor(end)
    }
  }, [])

  useEffect(() => {
    // Update CSS variables when gradient changes
    document.documentElement.style.setProperty('--card-gradient-start', startColor)
    document.documentElement.style.setProperty('--card-gradient-end', endColor)
  }, [startColor, endColor])

  const updateGradient = (start: string, end: string) => {
    setStartColor(start)
    setEndColor(end)
    localStorage.setItem('app-gradient', JSON.stringify({ start, end }))
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