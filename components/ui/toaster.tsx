"use client"

import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.slice(0, 3).map(function ({ id, title, description, action, duration = 2000, ...props }: any) {
        return (
          <ToastItem
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            duration={duration}
            onDismiss={() => dismiss(id)}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

function ToastItem({
  id,
  title,
  description,
  action,
  duration = 2000,
  onDismiss,
  ...props
}: any) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <Toast
      {...props}
      className="relative overflow-hidden border border-emerald-500/50 bg-zinc-950/95 text-white shadow-xl shadow-emerald-950/40 cursor-pointer active:scale-98 transition-transform"
      onClick={onDismiss}
    >
      <div className="grid gap-1 relative z-10">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && (
          <ToastDescription>{description}</ToastDescription>
        )}
      </div>
      {action}
      <ToastClose onClick={onDismiss} />

      {/* Vibrant Green Perimeter Fuse Border (Starts top-right, depletes clockwise over 2 seconds) */}
      <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden z-20">
        <svg className="w-full h-full text-emerald-400 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`toast-emerald-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id={`toast-emerald-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 96 0 A 4 4 0 0 1 100 4 L 100 96 A 4 4 0 0 1 96 100 L 4 100 A 4 4 0 0 1 0 96 L 0 4 A 4 4 0 0 1 4 0 Z"
            fill="none"
            stroke={`url(#toast-emerald-gradient-${id})`}
            strokeWidth="3.5"
            vectorEffect="non-scaling-stroke"
            filter={`url(#toast-emerald-glow-${id})`}
            className="animate-toast-perimeter"
            style={{
              animationDuration: `${duration}ms`,
            }}
          />
        </svg>
      </div>
    </Toast>
  )
}
