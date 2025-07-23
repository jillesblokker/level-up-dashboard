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
  '6xl': 'text-6xl',  // 60px

  // Font Weights
  thin: 'font-thin',        // 100
  extralight: 'font-extralight', // 200
  light: 'font-light',      // 300
  normal: 'font-normal',    // 400
  medium: 'font-medium',    // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold',        // 700
  extrabold: 'font-extrabold', // 800
  black: 'font-black',      // 900

  // Font Families
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
} as const

export const lineHeights = {
  none: 'leading-none',     // 1
  tight: 'leading-tight',   // 1.25
  snug: 'leading-snug',     // 1.375
  normal: 'leading-normal', // 1.5
  relaxed: 'leading-relaxed', // 1.625
  loose: 'leading-loose',   // 2
} as const

export const letterSpacing = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
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
    bgLight: 'bg-emerald-500/10',
    bgDark: 'bg-emerald-600',
  },
  warning: {
    light: 'text-amber-400',
    default: 'text-amber-500',
    dark: 'text-amber-600',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
    bgLight: 'bg-amber-500/10',
    bgDark: 'bg-amber-600',
  },
  error: {
    light: 'text-red-400',
    default: 'text-red-500',
    dark: 'text-red-600',
    bg: 'bg-red-500',
    border: 'border-red-500',
    bgLight: 'bg-red-500/10',
    bgDark: 'bg-red-600',
  },
  info: {
    light: 'text-blue-400',
    default: 'text-blue-500',
    dark: 'text-blue-600',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    bgLight: 'bg-blue-500/10',
    bgDark: 'bg-blue-600',
  },

  // Theme Colors (Amber Theme)
  primary: {
    light: 'text-amber-400',
    default: 'text-amber-500',
    dark: 'text-amber-600',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
    bgLight: 'bg-amber-500/10',
    bgDark: 'bg-amber-600',
    bgTransparent: 'bg-amber-500/20',
  },
  secondary: {
    light: 'text-gray-300',
    default: 'text-gray-400',
    dark: 'text-gray-500',
    bg: 'bg-gray-900/50',
    border: 'border-amber-800/20',
    bgLight: 'bg-gray-800/50',
    bgDark: 'bg-gray-700/50',
    bgTransparent: 'bg-gray-900/20',
  },
  background: {
    primary: 'bg-black',
    secondary: 'bg-gray-900',
    card: 'bg-[var(--card-background)]',
    overlay: 'bg-black/50',
    backdrop: 'bg-gray-900/90',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-400',
    muted: 'text-gray-500',
    inverse: 'text-black',
  },
  border: {
    primary: 'border-amber-800/20',
    secondary: 'border-gray-800',
    focus: 'border-amber-500',
    error: 'border-red-500',
  },
} as const

export const animation = {
  // Duration
  fast: 'duration-75',
  normal: 'duration-200',
  slow: 'duration-300',
  slower: 'duration-500',
  
  // Easing
  ease: 'ease-in-out',
  linear: 'ease-linear',
  in: 'ease-in',
  out: 'ease-out',
  
  // Transitions
  all: 'transition-all',
  colors: 'transition-colors',
  transform: 'transition-transform',
  opacity: 'transition-opacity',
  
  // Animations
  fadeIn: 'animate-in fade-in-0',
  fadeOut: 'animate-out fade-out-0',
  slideIn: 'animate-in slide-in-from-bottom-2',
  slideOut: 'animate-out slide-out-to-bottom-2',
  scaleIn: 'animate-in zoom-in-95',
  scaleOut: 'animate-out zoom-out-95',
} as const

export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  amber: 'shadow-amber-800/10',
  amberLg: 'shadow-amber-800/20',
} as const

export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const

export const focus = {
  ring: 'focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
  outline: 'focus-visible:outline-none',
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
} as const

export const hover = {
  scale: 'hover:scale-105',
  scaleSm: 'hover:scale-102',
  lift: 'hover:-translate-y-1',
  glow: 'hover:shadow-amber-800/20',
} as const

// Type definitions for typography parameters
type TypographySize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
type TypographyWeight = 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
type TypographyFamily = 'sans' | 'serif' | 'mono'
type LineHeight = keyof typeof lineHeights
type LetterSpacing = keyof typeof letterSpacing

// Utility Functions
export const createTypographyClass = (
  size: TypographySize,
  weight: TypographyWeight = 'normal',
  family: TypographyFamily = 'sans',
  lineHeight?: LineHeight,
  letterSpacingValue?: LetterSpacing
) => {
  const classes: string[] = [typography[size], typography[weight], typography[family]]
  if (lineHeight) classes.push(lineHeights[lineHeight])
  if (letterSpacingValue) classes.push(letterSpacing[letterSpacingValue])
  return classes.join(' ')
}

export const createSpacingClass = (value: keyof typeof spacing) => {
  return spacing[value]
}

export const createColorClass = (
  type: keyof typeof colors,
  variant: string = 'default'
) => {
  const colorObj = colors[type] as any
  return colorObj[variant] || colorObj.default
}

export const createAnimationClass = (
  duration: keyof typeof animation = 'normal',
  property: keyof typeof animation = 'colors'
) => {
  return `${animation[property]} ${animation[duration]}`
}

// Component-specific utilities
export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  variants: {
    primary: 'bg-amber-500 text-black hover:bg-amber-600 focus-visible:ring-amber-500',
    secondary: 'bg-gray-900/50 text-white border border-amber-800/20 hover:bg-gray-800/50',
    outline: 'border border-amber-800/20 bg-transparent hover:bg-amber-900/20 hover:text-amber-400',
    ghost: 'hover:bg-amber-900/20 hover:text-amber-400',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  },
  sizes: {
    sm: 'h-9 px-3',
    default: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  },
} as const

export const cardStyles = {
  base: 'rounded-lg border border-amber-800/20 bg-[var(--card-background)] shadow-sm transition-all duration-200',
  hover: 'hover:shadow-amber-800/10 hover:border-amber-800/30',
  interactive: 'cursor-pointer hover:shadow-amber-800/10 hover:border-amber-800/30 hover:scale-[1.02]',
} as const

export const inputStyles = {
  base: 'flex h-10 w-full rounded-md border border-amber-800/20 bg-gray-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-white',
  focus: 'focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
} as const 