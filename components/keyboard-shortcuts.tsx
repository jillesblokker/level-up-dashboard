"use client"

import { useEffect, useState } from 'react'
import { KeyboardShortcuts } from '@/lib/accessibility'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Keyboard, HelpCircle } from 'lucide-react'

interface Shortcut {
  key: string
  description: string
  category: string
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { key: 'Q', description: 'Go to Quests', category: 'Navigation' },
  { key: 'C', description: 'Go to Challenges', category: 'Navigation' },
  { key: 'M', description: 'Go to Milestones', category: 'Navigation' },
  { key: 'K', description: 'Go to Kingdom', category: 'Navigation' },
  { key: 'I', description: 'Open Inventory', category: 'Navigation' },
  { key: 'A', description: 'Go to Achievements', category: 'Navigation' },
  
  // Actions
  { key: 'N', description: 'Add New Quest', category: 'Actions' },
  { key: 'E', description: 'Edit Selected Item', category: 'Actions' },
  { key: 'Delete', description: 'Delete Selected Item', category: 'Actions' },
  { key: 'Enter', description: 'Complete Selected Item', category: 'Actions' },
  { key: 'F', description: 'Toggle Favorite', category: 'Actions' },
  
  // Kingdom
  { key: 'B', description: 'Buy Tile', category: 'Kingdom' },
  { key: 'P', description: 'Place Tile', category: 'Kingdom' },
  { key: 'R', description: 'Rotate Tile', category: 'Kingdom' },
  
  // Movement
  { key: 'W/A/S/D', description: 'Move Character', category: 'Movement' },
  { key: 'Arrow Keys', description: 'Move Character', category: 'Movement' },
  
  // System
  { key: 'H', description: 'Show Help', category: 'System' },
  { key: 'Escape', description: 'Close Modal/Dialog', category: 'System' },
  { key: 'Ctrl+S', description: 'Save Progress', category: 'System' },
]

interface KeyboardShortcutsProps {
  onNavigate?: (route: string) => void
  onAddQuest?: () => void
  onAddChallenge?: () => void
  onAddMilestone?: () => void
  onBuyTile?: () => void
  onShowHelp?: () => void
}

export function KeyboardShortcutsProvider({ 
  onNavigate,
  onAddQuest,
  onAddChallenge,
  onAddMilestone,
  onBuyTile,
  onShowHelp
}: KeyboardShortcutsProps) {
  const [shortcuts] = useState(() => new KeyboardShortcuts())
  
  useEffect(() => {
    // Register shortcuts
    shortcuts.register('q', () => onNavigate?.('/quests'))
    shortcuts.register('c', () => onNavigate?.('/quests?tab=challenges'))
    shortcuts.register('m', () => onNavigate?.('/quests?tab=milestones'))
    shortcuts.register('k', () => onNavigate?.('/kingdom'))
    shortcuts.register('i', () => onNavigate?.('/inventory'))
    shortcuts.register('a', () => onNavigate?.('/achievements'))
    
    shortcuts.register('n', () => onAddQuest?.())
    shortcuts.register('b', () => onBuyTile?.())
    shortcuts.register('h', () => onShowHelp?.())
    
    // Enable shortcuts
    shortcuts.enable()
    
    return () => {
      shortcuts.disable()
    }
  }, [shortcuts, onNavigate, onAddQuest, onAddChallenge, onAddMilestone, onBuyTile, onShowHelp])
  
  return null
}

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)
  
  const shortcutsByCategory = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="w-4 h-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-amber-400 mb-3">{category}</h3>
              <div className="grid gap-2">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                    <span className="text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-amber-900/20 rounded-lg">
          <p className="text-sm text-amber-300">
            💡 Tip: Keyboard shortcuts work when you're not typing in input fields
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KeyboardShortcutsIndicator() {
  const [showIndicator, setShowIndicator] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return // Ignore modifier keys
      
      const key = e.key.toLowerCase()
      if (['q', 'c', 'm', 'k', 'i', 'a', 'n', 'b', 'h'].includes(key)) {
        setShowIndicator(true)
        setTimeout(() => setShowIndicator(false), 1000)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  if (!showIndicator) return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-amber-500 text-black px-3 py-2 rounded-lg shadow-lg z-50 animate-pulse">
      <div className="flex items-center gap-2">
        <Keyboard className="w-4 h-4" />
        <span className="text-sm font-medium">Shortcut activated</span>
      </div>
    </div>
  )
} 