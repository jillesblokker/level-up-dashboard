// Animation utilities for consistent micro-interactions
import { animation } from './design-tokens'

// Animation classes for common interactions
export const animations = {
  // Hover effects
  hover: {
    scale: 'hover:scale-105 transition-transform duration-200',
    lift: 'hover:-translate-y-1 transition-transform duration-200 shadow-lg',
    glow: 'hover:shadow-lg hover:shadow-amber-500/20 transition-shadow duration-200',
  },
  
  // Focus effects
  focus: {
    ring: 'focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black',
    outline: 'focus:outline-none focus:ring-2 focus:ring-amber-500',
  },
  
  // Loading states
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
  },
  
  // Entrance animations
  entrance: {
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideDown: 'animate-in slide-in-from-top-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-300',
  },
  
  // Exit animations
  exit: {
    fadeOut: 'animate-out fade-out duration-200',
    slideUp: 'animate-out slide-out-to-bottom-4 duration-200',
    slideDown: 'animate-out slide-out-to-top-4 duration-200',
    scaleOut: 'animate-out zoom-out-95 duration-200',
  },
  
  // Success/Error states
  feedback: {
    success: 'animate-pulse bg-green-500/20 border-green-500',
    error: 'animate-pulse bg-red-500/20 border-red-500',
    warning: 'animate-pulse bg-amber-500/20 border-amber-500',
  },
} as const

// Utility function to combine animation classes
export const combineAnimations = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ')
}

// Predefined animation combinations - OPTIMIZED for faster performance
export const animationPresets = {
  // Interactive button - OPTIMIZED: Reduced from 300ms to 200ms
  button: combineAnimations(
    animations.hover.scale,
    animations.focus.ring,
    'transition-all duration-200'
  ),
  
  // Card hover effect - OPTIMIZED: Reduced from 300ms to 200ms
  card: combineAnimations(
    animations.hover.lift,
    animations.hover.glow,
    'transition-all duration-200'
  ),
  
  // Loading state - OPTIMIZED: Reduced from 300ms to 200ms
  loading: combineAnimations(
    animations.loading.pulse,
    'duration-200'
  ),
  
  // Success feedback - OPTIMIZED: Reduced from 150ms to 100ms
  success: combineAnimations(
    animations.feedback.success,
    'duration-100'
  ),
  
  // Error feedback - OPTIMIZED: Reduced from 150ms to 100ms
  error: combineAnimations(
    animations.feedback.error,
    'duration-100'
  ),
} as const 