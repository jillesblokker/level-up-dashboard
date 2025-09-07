// Enhanced Design Tokens for Medieval Theme
export const colors = {
  // Primary Amber Theme
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Primary
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  // Medieval Gold
  gold: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006'
  },
  
  // Dark Theme Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },
  
  // Status Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  
  // Medieval Accent Colors
  medieval: {
    red: '#8b0000',
    darkRed: '#4d0000',
    navy: '#000080',
    darkNavy: '#000040',
    forest: '#228b22',
    darkForest: '#006400',
    stone: '#696969',
    darkStone: '#2f4f4f',
    parchment: '#f5f5dc',
    darkParchment: '#deb887'
  }
}

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
  '5xl': '8rem'
}

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  amber: '0 0 20px rgba(245, 158, 11, 0.3)',
  glow: '0 0 30px rgba(245, 158, 11, 0.2)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
}

export const typography = {
  fontFamily: {
    serif: 'var(--font-cardo), ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem'
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
}

export const animation = {
  duration: {
    fast: '100ms',      // OPTIMIZED: Reduced from 150ms
    normal: '200ms',     // OPTIMIZED: Reduced from 300ms  
    slow: '300ms',      // OPTIMIZED: Reduced from 500ms
    slower: '400ms',    // OPTIMIZED: Reduced from 700ms
    slowest: '500ms'    // OPTIMIZED: Reduced from 1000ms
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    cubic: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  keyframes: {
    fadeIn: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }',
    fadeOut: '@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }',
    slideInUp: '@keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }',
    slideInDown: '@keyframes slideInDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }',
    slideInLeft: '@keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
    slideInRight: '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
    scaleIn: '@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }',
    pulse: '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }',
    bounce: '@keyframes bounce { 0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); } 40%, 43% { transform: translate3d(0, -30px, 0); } 70% { transform: translate3d(0, -15px, 0); } 90% { transform: translate3d(0, -4px, 0); } }',
    spin: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
    shimmer: '@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }',
    glow: '@keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); } 50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); } }'
  }
}

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
}

// Utility functions
export function createTypographyClass(fontSize: keyof typeof typography.fontSize, fontWeight: keyof typeof typography.fontWeight = 'normal') {
  return `${typography.fontSize[fontSize]} ${typography.fontWeight[fontWeight]}`
}

export function createSpacingClass(size: keyof typeof spacing) {
  return spacing[size]
}

export function createColorClass(color: string, shade?: string) {
  return shade ? `${color}-${shade}` : color
}

export function createShadowClass(shadow: keyof typeof shadows) {
  return shadows[shadow]
}

export function createAnimationClass(name: string, duration: keyof typeof animation.duration = 'normal', easing: keyof typeof animation.easing = 'ease') {
  return `${name} ${animation.duration[duration]} ${animation.easing[easing]}`
}

// Theme configuration
export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  animation,
  breakpoints,
  zIndex
}

// CSS Custom Properties
export const cssVariables = {
  '--color-primary': colors.amber[500],
  '--color-primary-dark': colors.amber[600],
  '--color-primary-light': colors.amber[400],
  '--color-background': colors.gray[900],
  '--color-surface': colors.gray[800],
  '--color-text': colors.gray[100],
  '--color-text-secondary': colors.gray[400],
  '--color-border': colors.amber[800],
  '--color-border-light': colors.amber[800] + '33',
  '--shadow-card': shadows.lg,
  '--shadow-elevated': shadows.xl,
  '--shadow-glow': shadows.amber,
  '--border-radius': borderRadius.lg,
  '--font-family': typography.fontFamily.serif,
  '--font-size-base': typography.fontSize.base,
  '--font-weight-normal': typography.fontWeight.normal,
  '--font-weight-bold': typography.fontWeight.bold,
  '--transition-normal': `${animation.duration.normal} ${animation.easing.cubic}`,
  '--z-dropdown': zIndex.dropdown,
  '--z-modal': zIndex.modal,
  '--z-toast': zIndex.toast
}

// Export everything
export default theme 