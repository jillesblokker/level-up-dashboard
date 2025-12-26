"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface FocusModeContextType {
    isFocusMode: boolean
    toggleFocusMode: () => void
    activeQuest: any | null // Use a looser type for flexibility or generic Quest type
    setFocusQuest: (quest: any | null) => void
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined)

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
    const [isFocusMode, setIsFocusMode] = useState(false)
    const [activeQuest, setActiveQuest] = useState<any | null>(null)

    // Prevent scrolling when in focus mode
    useEffect(() => {
        if (isFocusMode) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isFocusMode])

    const toggleFocusMode = () => {
        setIsFocusMode(prev => !prev)
    }

    const setFocusQuest = (quest: any | null) => {
        setActiveQuest(quest)
        if (quest && !isFocusMode) {
            setIsFocusMode(true)
        }
    }

    return (
        <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode, activeQuest, setFocusQuest }}>
            {children}
        </FocusModeContext.Provider>
    )
}

export function useFocusMode() {
    const context = useContext(FocusModeContext)
    if (context === undefined) {
        throw new Error('useFocusMode must be used within a FocusModeProvider')
    }
    return context
}
