"use client"

import { useEffect, useRef, useState, useLayoutEffect } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 340, h: 80 });
  const [totalLen, setTotalLen] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDims({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    }
  }, []);

  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) setTotalLen(Math.round(len));
      } catch {}
    }
  }, [dims]);

  const { w, h } = dims;
  const r = 8;
  // Clockwise path starting at EXACT top-right corner (w - r, 0)
  const pathD = `M ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;

  return (
    <Toast
      {...props}
      ref={containerRef}
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

      {/* Vibrant Single Green Perimeter Fuse Border (Starts top-right, depletes clockwise over 2s) */}
      <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden z-20">
        <svg className="w-full h-full text-emerald-400 overflow-visible">
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
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke={`url(#toast-emerald-gradient-${id})`}
            strokeWidth="3.5"
            filter={`url(#toast-emerald-glow-${id})`}
            style={{
              strokeDasharray: totalLen ? `${totalLen} ${totalLen}` : '1000 1000',
              strokeDashoffset: 0,
              ['--toast-perimeter-len' as any]: `${totalLen || 1000}px`,
              animation: totalLen ? `toast-perimeter-deplete ${duration}ms linear forwards` : 'none',
            }}
          />
        </svg>
      </div>
    </Toast>
  )
}
