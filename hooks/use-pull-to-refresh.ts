import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number // Distance in pixels to trigger refresh
  resistance?: number // How much resistance when pulling
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isPulling = useRef<boolean>(false)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger on top of page
      if (window.scrollY === 0 && e.touches[0]) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing || !e.touches[0]) return

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        e.preventDefault()
        const resistanceDistance = distance / resistance
        setPullDistance(resistanceDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing) return

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
      isPulling.current = false
    }

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, threshold, resistance, pullDistance, isRefreshing])

  return {
    isRefreshing,
    pullDistance,
    shouldShowRefreshIndicator: pullDistance > 0
  }
} 