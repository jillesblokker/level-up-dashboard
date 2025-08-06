// Accessibility utilities for better keyboard navigation and screen reader support

/**
 * Trap focus within a container element
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab' && firstElement && lastElement) {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }
  
  container.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Create a live region for screen reader announcements
 */
export function createLiveRegion(): HTMLElement {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only'
  liveRegion.id = 'live-region'
  document.body.appendChild(liveRegion)
  return liveRegion
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string) {
  let liveRegion = document.getElementById('live-region')
  if (!liveRegion) {
    liveRegion = createLiveRegion()
  }
  liveRegion.textContent = message
}

/**
 * Enhanced focus trap hook for modals
 */
export function useFocusTrap(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return
    
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (firstElement) {
      firstElement.focus()
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && firstElement && lastElement) {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])
}

/**
 * Generate accessible labels for game elements
 */
export function generateAccessibleLabel(element: string, context?: Record<string, any>): string {
  const labels: Record<string, string> = {
    'monster-battle': 'Monster battle interface',
    'realm-map': 'Realm map grid',
    'character-stats': 'Character statistics',
    'quest-list': 'Available quests',
    'inventory': 'Character inventory',
    'achievements': 'Achievement progress',
  }
  
  let label = labels[element] || element
  
  if (context) {
    if (context['name']) label += ` - ${context['name']}`
    if (context['level']) label += ` - Level ${context['level']}`
    if (context['type']) label += ` - ${context['type']}`
  }
  
  return label
}

/**
 * Skip to main content link for keyboard users
 */
export function createSkipLink(): HTMLElement {
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-500 text-black px-4 py-2 rounded z-50'
  
  return skipLink
}

/**
 * Keyboard shortcuts manager
 */
export class KeyboardShortcuts {
  private shortcuts: Map<string, () => void> = new Map()
  
  register(key: string, callback: () => void) {
    this.shortcuts.set(key.toLowerCase(), callback)
  }
  
  unregister(key: string) {
    this.shortcuts.delete(key.toLowerCase())
  }
  
  handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    const callback = this.shortcuts.get(key)
    
    if (callback && !this.isInInput(event.target as HTMLElement)) {
      event.preventDefault()
      callback()
    }
  }
  
  private isInInput(element: HTMLElement | null): boolean {
    if (!element) return false
    return element.tagName === 'INPUT' || 
           element.tagName === 'TEXTAREA' || 
           element.isContentEditable
  }
  
  enable() {
    document.addEventListener('keydown', this.handleKeyDown)
  }
  
  disable() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }
} 