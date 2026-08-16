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
      className="relative overflow-hidden border border-emerald-500/40 bg-zinc-950/95 text-white shadow-xl shadow-emerald-950/30 cursor-pointer active:scale-98 transition-transform"
      onClick={onDismiss}
    >
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && (
          <ToastDescription>{description}</ToastDescription>
        )}
      </div>
      {action}
      <ToastClose onClick={onDismiss} />

      {/* Vibrant Green Countdown Fuse Border Line (2-second auto-dismissal) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/90 overflow-hidden pointer-events-none rounded-b-lg">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 shadow-[0_0_10px_#10b981] animate-toast-fuse"
          style={{
            animationDuration: `${duration}ms`,
          }}
        />
      </div>
    </Toast>
  )
}
