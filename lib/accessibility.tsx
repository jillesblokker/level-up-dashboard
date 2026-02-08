/**
 * Accessibility Utilities
 * 
 * Helper functions and components to improve accessibility across the app.
 */

import { KeyboardEvent } from 'react'

/**
 * Creates keyboard event handler for clickable non-button elements.
 * Ensures elements are accessible via keyboard navigation.
 * 
 * @example
 * <div
 *   onClick={handleClick}
 *   onKeyDown={handleKeyboardClick(handleClick)}
 *   tabIndex={0}
 *   role="button"
 * >
 *   Clickable div
 * </div>
 */
export function handleKeyboardClick(
    onClick: () => void,
    options: { preventDefault?: boolean } = {}
) {
    return (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            if (options.preventDefault !== false) {
                event.preventDefault()
            }
            onClick()
        }
    }
}

/**
 * Props to make a non-button element keyboard accessible
 */
export interface AccessibleClickProps {
    onClick: () => void
    tabIndex?: number
    role?: string
    'aria-label'?: string
}

/**
 * Returns props to make a div/span clickable and accessible
 * 
 * @example
 * <div {...makeAccessibleClick(() => handleAction(), 'Perform action')}>
 *   Click me
 * </div>
 */
export function makeAccessibleClick(
    onClick: () => void,
    ariaLabel?: string
): {
    onClick: () => void
    onKeyDown: (e: KeyboardEvent) => void
    tabIndex: number
    role: string
    'aria-label'?: string
} {
    return {
        onClick,
        onKeyDown: handleKeyboardClick(onClick),
        tabIndex: 0,
        role: 'button',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {})
    }
}

/**
 * Accessible toggle props for checkbox-like elements
 */
export function makeAccessibleToggle(
    isChecked: boolean,
    onToggle: () => void,
    label: string
): {
    onClick: () => void
    onKeyDown: (e: KeyboardEvent) => void
    tabIndex: number
    role: string
    'aria-checked': boolean
    'aria-label': string
} {
    return {
        onClick: onToggle,
        onKeyDown: handleKeyboardClick(onToggle),
        tabIndex: 0,
        role: 'checkbox',
        'aria-checked': isChecked,
        'aria-label': label
    }
}

/**
 * Skip link component for keyboard navigation
 * Allows keyboard users to skip repetitive navigation
 */
export function SkipLink({
    href = '#main-content',
    children = 'Skip to main content'
}: {
    href?: string
    children?: React.ReactNode
}) {
    return (
        <a
            href={href}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:rounded-md focus:shadow-lg focus:outline-none"
        >
            {children}
        </a>
    )
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({
    children,
    as: Component = 'span'
}: {
    children: React.ReactNode
    as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}) {
    return (
        <Component className="sr-only">
            {children}
        </Component>
    )
}

/**
 * Announce changes to screen readers
 * Uses ARIA live regions for dynamic content updates
 */
export function AriaAnnouncement({
    message,
    politeness = 'polite'
}: {
    message: string
    politeness?: 'polite' | 'assertive'
}) {
    return (
        <div
            role="status"
            aria-live={politeness}
            aria-atomic="true"
            className="sr-only"
        >
            {message}
        </div>
    )
}

/**
 * Focus trap hook for modals and dialogs
 * Keeps focus within a container for keyboard users
 */
export function trapFocus(containerRef: React.RefObject<HTMLElement>) {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !containerRef.current) return

        const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
        }
    }

    return { onKeyDown: handleKeyDown as unknown as React.KeyboardEventHandler }
}

/**
 * Common ARIA labels for the app
 */
export const ARIA_LABELS = {
    // Navigation
    mainNav: 'Main navigation',
    mobileMenu: 'Mobile menu',
    closeMenu: 'Close menu',

    // Actions
    completeQuest: (questName: string) => `Mark ${questName} as complete`,
    deleteQuest: (questName: string) => `Delete ${questName}`,
    editQuest: (questName: string) => `Edit ${questName}`,

    // Status
    loading: 'Loading...',
    syncStatus: (status: string) => `Sync status: ${status}`,

    // Forms
    searchQuests: 'Search quests',
    filterByCategory: 'Filter by category',

    // Stats
    currentLevel: (level: number) => `Current level: ${level}`,
    currentGold: (gold: number) => `${gold} gold`,
    currentXP: (xp: number, nextLevel: number) => `${xp} XP, ${nextLevel} XP until next level`,

    // Kingdom
    placeTile: (tileType: string, x: number, y: number) =>
        `Place ${tileType} tile at position ${x}, ${y}`,
    selectTile: (tileType: string) => `Select ${tileType} tile`,
} as const
