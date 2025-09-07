import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Medieval Color Palette
export const medievalColors = {
  primary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // Main gold
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  stone: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  forest: {
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
  },
  earth: {
    50: '#fef7ed',
    100: '#fed7aa',
    200: '#fdba74',
    300: '#fb923c',
    400: '#f97316',
    500: '#ea580c',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  }
} as const;

// Medieval Button Component
interface MedievalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  medieval?: boolean;
  children: React.ReactNode;
}

export function MedievalButton({
  variant = 'primary',
  size = 'md',
  medieval = true,
  className,
  children,
  ...props
}: MedievalButtonProps) {
  const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: medieval 
      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-amber-50 border border-amber-500/30 shadow-lg hover:shadow-xl focus:ring-amber-500' 
      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: medieval
      ? 'bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-stone-100 border border-stone-500/30 shadow-lg hover:shadow-xl focus:ring-stone-500'
      : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: medieval
      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-red-50 border border-red-500/30 shadow-lg hover:shadow-xl focus:ring-red-500'
      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: medieval
      ? 'text-amber-200 hover:bg-amber-800/30 border border-amber-600/30 hover:border-amber-500/50 focus:ring-amber-500'
      : 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };

  return (
    <Button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        medieval && 'transform hover:scale-105 active:scale-95',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Medieval Input Component
interface MedievalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  medieval?: boolean;
  label?: string;
  error?: string;
}

export function MedievalInput({
  medieval = true,
  label,
  error,
  className,
  ...props
}: MedievalInputProps) {
  const inputClasses = medieval
    ? 'bg-amber-50/10 border-amber-600/30 text-amber-100 placeholder-amber-300/50 focus:border-amber-500 focus:ring-amber-500/20 backdrop-blur-sm'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20';

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-amber-200">
          {label}
        </label>
      )}
      <Input
        className={cn(
          'transition-all duration-200',
          inputClasses,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          medieval && 'rounded-lg shadow-inner',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// Medieval Card Component
interface MedievalCardProps {
  children: React.ReactNode;
  medieval?: boolean;
  className?: string;
  title?: string;
  glow?: boolean;
}

export function MedievalCard({
  children,
  medieval = true,
  className,
  title,
  glow = false
}: MedievalCardProps) {
  const cardClasses = medieval
    ? 'bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-700/30 backdrop-blur-sm shadow-xl'
    : 'bg-white border border-gray-200 shadow-sm';

  return (
    <Card className={cn(
      'transition-all duration-200',
      cardClasses,
      glow && medieval && 'shadow-amber-500/20 shadow-2xl',
      className
    )}>
      {title && (
        <CardHeader className={medieval ? 'border-b border-amber-700/30' : 'border-b border-gray-200'}>
          <CardTitle className={medieval ? 'text-amber-100 font-serif' : 'text-gray-900'}>
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={medieval ? 'text-amber-200' : 'text-gray-700'}>
        {children}
      </CardContent>
    </Card>
  );
}

// Medieval Badge Component
interface MedievalBadgeProps {
  children: React.ReactNode;
  variant?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  medieval?: boolean;
  className?: string;
}

export function MedievalBadge({
  children,
  variant = 'common',
  medieval = true,
  className
}: MedievalBadgeProps) {
  const variantClasses = {
    common: medieval 
      ? 'bg-gray-600/80 text-gray-100 border border-gray-500/30' 
      : 'bg-gray-100 text-gray-800',
    uncommon: medieval
      ? 'bg-green-600/80 text-green-100 border border-green-500/30'
      : 'bg-green-100 text-green-800',
    rare: medieval
      ? 'bg-blue-600/80 text-blue-100 border border-blue-500/30'
      : 'bg-blue-100 text-blue-800',
    epic: medieval
      ? 'bg-purple-600/80 text-purple-100 border border-purple-500/30'
      : 'bg-purple-100 text-purple-800',
    legendary: medieval
      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-900 border border-amber-400/50 shadow-lg'
      : 'bg-yellow-100 text-yellow-800'
  };

  return (
    <Badge className={cn(
      'font-medium transition-all duration-200',
      variantClasses[variant],
      medieval && 'backdrop-blur-sm shadow-sm',
      className
    )}>
      {children}
    </Badge>
  );
}

// Medieval Loading Spinner
interface MedievalSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function MedievalSpinner({
  size = 'md',
  text,
  className
}: MedievalSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative">
        <div className={cn(
          'border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin',
          sizeClasses[size]
        )}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-amber-500 text-sm">⚔️</span>
        </div>
      </div>
      {text && (
        <span className="text-amber-200 text-sm font-medium">{text}</span>
      )}
    </div>
  );
}

// Medieval Progress Bar
interface MedievalProgressProps {
  value: number;
  max?: number;
  medieval?: boolean;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function MedievalProgress({
  value,
  max = 100,
  medieval = true,
  className,
  showLabel = true,
  label
}: MedievalProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className={medieval ? 'text-amber-200' : 'text-gray-700'}>
            {label || 'Progress'}
          </span>
          <span className={medieval ? 'text-amber-300' : 'text-gray-500'}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full overflow-hidden',
        medieval ? 'bg-amber-900/30 border border-amber-700/30' : 'bg-gray-200'
      )}>
        <div
          className={cn(
            'h-2 transition-all duration-300 ease-out',
            medieval 
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-sm' 
              : 'bg-blue-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
