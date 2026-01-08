"use client"

import { useEffect, useRef } from 'react'

/**
 * Hook to manage auto-hiding scrollbars
 * Adds/removes classes to show scrollbars while scrolling
 * and fade them out after scrolling stops
 */
export function useAutoHideScrollbar<T extends HTMLElement>() {
    const elementRef = useRef<T>(null)
    const scrollTimeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        let isScrolling = false

        const handleScroll = () => {
            // Clear existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }

            // Add scrolling class if not already present
            if (!isScrolling) {
                element.classList.add('scrolling')
                element.classList.remove('scroll-fade-out')
                isScrolling = true
            }

            // Set timeout to remove scrolling class and add fade-out
            scrollTimeoutRef.current = setTimeout(() => {
                element.classList.remove('scrolling')
                element.classList.add('scroll-fade-out')
                isScrolling = false

                // Remove fade-out class after animation completes
                setTimeout(() => {
                    element.classList.remove('scroll-fade-out')
                }, 500)
            }, 1000) // Hide scrollbar 1 second after scrolling stops
        }

        // Add scroll event listener
        element.addEventListener('scroll', handleScroll, { passive: true })

        // Cleanup
        return () => {
            element.removeEventListener('scroll', handleScroll)
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [])

    return elementRef
}
