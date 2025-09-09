"use client"

import { useEffect, useRef, useCallback } from 'react'

interface GestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: (() => void) | undefined
  onDoubleTap?: () => void
  swipeThreshold?: number
  longPressDelay?: number
}

export function useMobileGestures(config: GestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    onDoubleTap,
    swipeThreshold = 50,
    longPressDelay = 500
  } = config

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress()
      }, longPressDelay)
    }
  }, [onLongPress, longPressDelay])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const touch = e.changedTouches[0]
    if (!touch) return
    
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Determine if it's a swipe or tap
    const isSwipe = Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold
    const isQuickTap = deltaTime < 300

    if (isSwipe) {
      // Handle swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    } else if (isQuickTap) {
      // Handle tap gestures
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (timeSinceLastTap < 300) {
        // Double tap
        onDoubleTap?.()
        lastTapRef.current = 0 // Reset to prevent triple tap
      } else {
        // Single tap
        onTap?.()
        lastTapRef.current = now
      }
    }

    touchStartRef.current = null
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, swipeThreshold])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const element = document.body

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [handleTouchStart, handleTouchEnd, handleTouchMove])

  return {
    // Utility functions for gesture handling
    preventDefault: (e: TouchEvent) => e.preventDefault(),
    stopPropagation: (e: TouchEvent) => e.stopPropagation()
  }
}

// Hook for quest-specific gestures
export function useQuestGestures(
  onFavorite: () => void,
  onComplete: () => void,
  onEdit?: () => void
) {
  return useMobileGestures({
    onSwipeLeft: onFavorite, // Swipe left to favorite
    onSwipeRight: onComplete, // Swipe right to complete
    onLongPress: onEdit, // Long press to edit
    swipeThreshold: 30,
    longPressDelay: 800
  })
}
