// Design Token System
// This file contains all design tokens for consistent styling across the application

export const typography = {
  // Font Sizes (8pt scale)
  xs: 'text-xs',      // 12px
  sm: 'text-sm',      // 14px
  base: 'text-base',  // 16px
  lg: 'text-lg',      // 18px
  xl: 'text-xl',      // 20px
  '2xl': 'text-2xl',  // 24px
  '3xl': 'text-3xl',  // 30px
  '4xl': 'text-4xl',  // 36px
  '5xl': 'text-5xl',  // 48px

  // Font Weights
  normal: 'font-normal',    // 400
  medium: 'font-medium',    // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold',        // 700

  // Font Families
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',

  // Line Heights
  lineTight: 'leading-tight',    // 1.25
  lineNormal: 'leading-normal',  // 1.5
  lineRelaxed: 'leading-relaxed', // 1.625

  // Letter Spacing
  letterTight: 'tracking-tight',
  letterNormal: 'tracking-normal',
  letterWide: 'tracking-wide',
  letterWider: 'tracking-wider',
} as const

export const spacing = {
  // Spacing Scale (4px base)
  0: '0',
  1: '1px',
  2: '2px',
  3: '3px',
  4: '4px',
  5: '5px',
  6: '6px',
  8: '8px',
  10: '10px',
  12: '12px',
  16: '16px',
  20: '20px',
  24: '24px',
  32: '32px',
  40: '40px',
  48: '48px',
  56: '56px',
  64: '64px',
  80: '80px',
  96: '96px',
  128: '128px',
} as const

export const colors = {
  // Semantic Colors
  success: {
    light: 'text-emerald-400',
    default: 'text-emerald-500',
    dark: 'text-emerald-600',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
  },
  warning: {
    light: 'text-amber-400',
    default: 'text-amber-500',
    dark: 'text-amber-600',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  error: {
    light: 'text-red-400',
    default: 'text-red-500',
    dark: 'text-red-600',
    bg: 'bg-red-500',
    border: 'border-red-500',
  },
  info: {
    light: 'text-blue-400',
    default: 'text-blue-500',
    dark: 'text-blue-600',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
  },

  // Theme Colors
  primary: {
    light: 'text-amber-400',
    default: 'text-amber-500',
    dark: 'text-amber-600',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  secondary: {
    light: 'text-gray-400',
    default: 'text-gray-500',
    dark: 'text-gray-600',
    bg: 'bg-gray-500',
    border: 'border-gray-500',
  },
} as const

export const animation = {
  // Timing
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',

  // Easing
  ease: 'ease-in-out',
  linear: 'ease-linear',
  bounce: 'ease-bounce',

  // Transitions
  all: 'transition-all',
  colors: 'transition-colors',
  transform: 'transition-transform',
  opacity: 'transition-opacity',
} as const

export const shadows = {
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const

export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

// Utility functions for combining tokens
export const createTypographyClass = (
  size: keyof typeof typography,
  weight: keyof typeof typography = 'normal',
  family: keyof typeof typography = 'sans',
  lineHeight?: keyof typeof typography,
  letterSpacing?: keyof typeof typography
) => {
  const classes = [
    typography[size],
    typography[weight],
    typography[family],
  ]
  
  if (lineHeight) classes.push(typography[lineHeight])
  if (letterSpacing) classes.push(typography[letterSpacing])
  
  return classes.join(' ')
}

export const createSpacingClass = (value: keyof typeof spacing) => {
  return spacing[value]
}

export const createColorClass = (
  type: keyof typeof colors,
  variant: keyof typeof colors.success = 'default'
) => {
  return colors[type][variant]
} 