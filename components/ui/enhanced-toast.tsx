"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Star, 
  Trophy, 
  Sword, 
  Shield,
  Crown,
  Zap,
  Heart
} from "lucide-react"
import { Button } from "./button"

interface EnhancedToastProps {
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'quest' | 'kingdom' | 'inventory'
  duration?: number
  onClose?: () => void
  className?: string
  showProgress?: boolean
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-600/20',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    iconColor: 'text-green-500',
    title: 'Success'
  },
  error: {
    icon: AlertTriangle,
    bgColor: 'bg-red-600/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconColor: 'text-red-500',
    title: 'Error'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-600/20',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    iconColor: 'text-yellow-500',
    title: 'Warning'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-500',
    title: 'Info'
  },
  achievement: {
    icon: Star,
    bgColor: 'bg-purple-600/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-500',
    title: 'Achievement Unlocked!'
  },
  quest: {
    icon: Sword,
    bgColor: 'bg-amber-600/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500',
    title: 'Quest Update'
  },
  kingdom: {
    icon: Crown,
    bgColor: 'bg-amber-600/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500',
    title: 'Kingdom Update'
  },
  inventory: {
    icon: Shield,
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-500',
    title: 'Inventory Update'
  }
}

export function EnhancedToast({
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
  className,
  showProgress = true
}: EnhancedToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  const [isHovered, setIsHovered] = useState(false)

  const config = toastConfig[type]
  const Icon = config.icon

  useEffect(() => {
    if (!showProgress || isHovered) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          setIsVisible(false)
          onClose?.()
          return 0
        }
        return prev - (100 / (duration / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onClose, showProgress, isHovered])

  useEffect(() => {
    if (!isVisible) {
      onClose?.()
    }
  }, [isVisible, onClose])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-300",
        "bg-gradient-to-br from-gray-900/95 to-gray-800/95",
        config.borderColor,
        "transform translate-x-0 opacity-100",
        "hover:scale-105 hover:shadow-lg",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      {/* Background glow effect */}
      <div className={cn(
        "absolute inset-0 opacity-20 blur-sm",
        config.bgColor
      )} />
      
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
          <div 
            className={cn("h-full transition-all duration-100", config.bgColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50",
            "group-hover:bg-amber-500/20 group-hover:border-amber-500/30 transition-all duration-300"
          )}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={cn("text-sm font-semibold", config.textColor)}>
                  {config.title}
                </h3>
                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {title}
                </p>
                {description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Special effects for certain types */}
        {type === 'achievement' && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
          </div>
        )}

        {type === 'quest' && (
          <div className="absolute bottom-2 left-2">
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized toast components
export function AchievementToast({ title, description, onClose }: Omit<EnhancedToastProps, 'type'>) {
  return (
    <EnhancedToast
      type="achievement"
      title={title}
      description={description}
      onClose={onClose}
      duration={8000}
    />
  )
}

export function QuestToast({ title, description, onClose }: Omit<EnhancedToastProps, 'type'>) {
  return (
    <EnhancedToast
      type="quest"
      title={title}
      description={description}
      onClose={onClose}
    />
  )
}

export function KingdomToast({ title, description, onClose }: Omit<EnhancedToastProps, 'type'>) {
  return (
    <EnhancedToast
      type="kingdom"
      title={title}
      description={description}
      onClose={onClose}
    />
  )
}

export function InventoryToast({ title, description, onClose }: Omit<EnhancedToastProps, 'type'>) {
  return (
    <EnhancedToast
      type="inventory"
      title={title}
      description={description}
      onClose={onClose}
    />
  )
}

// Toast container for managing multiple toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {children}
    </div>
  )
}

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`
document.head.appendChild(style) 