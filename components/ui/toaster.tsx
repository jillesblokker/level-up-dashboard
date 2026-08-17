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
      {toasts.slice(0, 3).map(function ({ id, title, description, action, duration = 3500, ...props }: any) {
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
  duration = 3500,
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
    const el = containerRef.current;
    if (!el) return undefined;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDims({ w: rect.width, h: rect.height });
        }
      }
    };

    updateSize();

    // Re-measure after CSS entry slide-in animation completes (350ms)
    const animTimer = setTimeout(updateSize, 350);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => {
        clearTimeout(animTimer);
        ro.disconnect();
      };
    }
    return () => clearTimeout(animTimer);
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
  const sw = 2.5;
  const inset = 1.25; // Symmetrical stroke inset for rounded-xl outer border
  const r = 12;
  const rx = Math.max(1, r - inset);

  // Clockwise path starting at EXACT top-right corner (w - r, inset)
  const pathD = `M ${w - r} ${inset} A ${rx} ${rx} 0 0 1 ${w - inset} ${r} L ${w - inset} ${h - r} A ${rx} ${rx} 0 0 1 ${w - r} ${h - inset} L ${r} ${h - inset} A ${rx} ${rx} 0 0 1 ${inset} ${h - r} L ${inset} ${r} A ${rx} ${rx} 0 0 1 ${r} ${inset} Z`;

  return (
    <Toast
      {...props}
      ref={containerRef}
      className="relative overflow-hidden cursor-pointer active:scale-98 transition-transform"
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

      {/* Vibrant Single Green Perimeter Fuse Border (Starts top-right, depletes clockwise over 3.5s) */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden z-20">
        <svg className="w-full h-full text-emerald-400 overflow-visible" viewBox={`0 0 ${w} ${h}`}>
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
            strokeWidth={sw}
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
