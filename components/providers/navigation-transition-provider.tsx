"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { SwordLoader } from '@/components/ui/sword-loader'

interface NavigationTransitionContextType {
  isTransitioning: boolean
  startTransition: (label?: string, sublabel?: string) => void
  endTransition: () => void
}

const NavigationTransitionContext = createContext<NavigationTransitionContextType>({
  isTransitioning: false,
  startTransition: () => {},
  endTransition: () => {},
})

export const useNavigationTransition = () => useContext(NavigationTransitionContext)

function SearchParamsListener({ onChange }: { onChange: () => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    onChange()
  }, [searchParams, onChange])
  return null
}

export function NavigationTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [label, setLabel] = useState<string | undefined>()
  const [sublabel, setSublabel] = useState<string | undefined>()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const endTransition = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsTransitioning(false)
    setLabel(undefined)
    setSublabel(undefined)
  }, [])

  const startTransition = useCallback((customLabel?: string, customSublabel?: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setLabel(customLabel || "Venturing forth...")
    setSublabel(customSublabel || "Journeying across the lands of the realm")
    setIsTransitioning(true)

    // Safety fallback: auto-hide after 8 seconds
    timeoutRef.current = setTimeout(() => {
      endTransition()
    }, 8000)
  }, [endTransition])

  // End transition when pathname changes
  useEffect(() => {
    endTransition()
  }, [pathname, endTransition])

  // Intercept internal link clicks to display the sweeping sword if navigation takes >150ms
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor
      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Ignore hash links, external links, mailto, tel, downloads, or new-tab links
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.getAttribute('target') === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return
      }

      // Check if it's an internal route
      try {
        const currentUrl = new URL(window.location.href)
        const targetUrl = new URL(href, window.location.href)

        if (targetUrl.origin === currentUrl.origin) {
          // If it's navigating to a different pathname
          if (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search) {
            // Debounce so instant cached page changes don't flicker
            debounceRef.current = setTimeout(() => {
              // Custom text if navigating to city, town, dungeon, kingdom
              let locLabel = "Venturing forth..."
              let locSub = "Traversing the realm"

              if (targetUrl.pathname.startsWith('/town')) {
                locLabel = "Entering Settlement..."
                locSub = "Approaching the village gates and market stalls"
              } else if (targetUrl.pathname.startsWith('/city')) {
                locLabel = "Entering City..."
                locSub = "Passing through the grand stone gates"
              } else if (targetUrl.pathname.startsWith('/dungeon')) {
                locLabel = "Entering Dungeon Keep..."
                locSub = "Preparing tactical stance and elemental guardians"
              } else if (targetUrl.pathname.startsWith('/realm')) {
                locLabel = "Returning to Realm..."
                locSub = "Surveying the open landscape"
              }

              setLabel(locLabel)
              setSublabel(locSub)
              setIsTransitioning(true)

              timeoutRef.current = setTimeout(() => {
                endTransition()
              }, 8000)
            }, 140)
          }
        }
      } catch (err) {
        // Invalid URL, ignore
      }
    }

    document.addEventListener('click', handleDocumentClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true })
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [endTransition])

  return (
    <NavigationTransitionContext.Provider value={{ isTransitioning, startTransition, endTransition }}>
      <Suspense fallback={null}>
        <SearchParamsListener onChange={endTransition} />
      </Suspense>
      {children}
      {isTransitioning && (
        <SwordLoader
          size="fullscreen"
          label={label}
          sublabel={sublabel}
        />
      )}
    </NavigationTransitionContext.Provider>
  )
}
