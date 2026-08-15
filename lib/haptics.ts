/**
 * Web Haptic Feedback Utility for iOS & Mobile Browsers
 * Safely triggers native vibration patterns on supported devices.
 */

export function hapticLight() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}

export function hapticMedium() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {}
  }
}

export function hapticHeavy() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([30, 40, 30]);
    } catch {}
  }
}

export function hapticSuccess() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([20, 30, 50]);
    } catch {}
  }
}

export function hapticError() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch {}
  }
}

export const HapticPatterns = {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  success: hapticSuccess,
  selection: hapticLight,
  warning: hapticHeavy,
  error: hapticError,
  tabSwitch: hapticLight,
  questComplete: hapticSuccess,
  soft: hapticLight,
  cardFlip: hapticMedium,
};

export function useHaptics() {
  return {
    trigger: (type?: keyof typeof HapticPatterns | any) => {
      if (typeof type === 'function') {
        try { type(); } catch {}
      } else {
        const pattern = HapticPatterns[(type as keyof typeof HapticPatterns) || 'light'] || hapticLight;
        pattern();
      }
    },
    ...HapticPatterns
  };
}
