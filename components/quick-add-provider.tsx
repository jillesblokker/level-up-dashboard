"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ResponsiveModal } from './ui/responsive-modal'
import { AddQuestForm } from './add-quest-form'

interface QuickAddContextType {
    openQuickAdd: (initialData?: any) => void
    closeQuickAdd: () => void
}

const QuickAddContext = createContext<QuickAddContextType | undefined>(undefined)

export function QuickAddProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [initialData, setInitialData] = useState<any>(undefined)

    const openQuickAdd = (data?: any) => {
        console.log('[QuickAddProvider] Opening modal', data ? 'with data' : '')
        setInitialData(data)
        setIsOpen(true)
    }
    const closeQuickAdd = () => {
        console.log('[QuickAddProvider] Closing modal')
        setIsOpen(false)
        setInitialData(undefined) // Reset data on close
    }

    return (
        <QuickAddContext.Provider value={{ openQuickAdd, closeQuickAdd }}>
            {children}
            <ResponsiveModal
                isOpen={isOpen}
                onClose={closeQuickAdd}
                title={initialData ? "Duplicate Quest" : "Add New Quest"}
            >
                <AddQuestForm
                    initialData={initialData}
                    onSuccess={() => {
                        closeQuickAdd()
                        // Optionally dispatch a global event to refresh lists
                        window.dispatchEvent(new CustomEvent('quest-added'))
                    }}
                    onCancel={closeQuickAdd}
                />
            </ResponsiveModal>
        </QuickAddContext.Provider>
    )
}

export function useQuickAdd() {
    const context = useContext(QuickAddContext)
    if (context === undefined) {
        throw new Error('useQuickAdd must be used within a QuickAddProvider')
    }
    return context
}
