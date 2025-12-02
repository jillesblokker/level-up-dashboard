"use client"

/**
 * Haptic feedback patterns for different interactions
 */
export const HapticPatterns = {
    // Light feedback for UI interactions
    soft: [10],
    medium: [20],
    heavy: [40],

    // Success patterns
    success: [10, 30, 10], // da-DA-da
    questComplete: [20, 50, 20, 50], // da-DA-da-DA
    levelUp: [50, 50, 50, 50, 100, 50, 100], // Rhythmic celebration

    // Error/Warning patterns
    error: [50, 30, 50, 30, 50], // buzz-buzz-buzz
    warning: [30, 100, 30],

    // Special interactions
    cardFlip: [15],
    itemPickup: [20, 20],
    tabSwitch: [10],
}

/**
 * Trigger haptic feedback if supported by the device
 */
export function triggerHaptic(pattern: number | number[]) {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try {
            window.navigator.vibrate(pattern)
        } catch (e) {
            // Ignore errors (some browsers might block it or throw)
            console.debug('Haptics not supported or blocked', e)
        }
    }
}

/**
 * Hook for easy access to haptics
 */
export function useHaptics() {
    return {
        trigger: triggerHaptic,
        patterns: HapticPatterns
    }
}
