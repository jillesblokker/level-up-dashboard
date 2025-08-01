"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors, typography } from "@/lib/design-tokens"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-6 pr-8 shadow-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border-amber-800/30 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-amber-500/10",
        destructive:
          "border-red-600/30 bg-gradient-to-r from-red-900 to-red-800 text-red-100 shadow-red-500/10",
        success: "border-emerald-600/30 bg-gradient-to-r from-emerald-900 to-emerald-800 text-emerald-100 shadow-emerald-500/10",
        warning: "border-amber-600/30 bg-gradient-to-r from-amber-900 to-amber-800 text-amber-100 shadow-amber-500/10",
        info: "border-blue-600/30 bg-gradient-to-r from-blue-900 to-blue-800 text-blue-100 shadow-blue-500/10",
        achievement: "border-amber-500/40 bg-gradient-to-r from-amber-900/90 to-yellow-800/90 text-amber-100 shadow-amber-400/20",
        quest: "border-amber-600/40 bg-gradient-to-r from-amber-900/90 to-orange-800/90 text-amber-100 shadow-amber-500/20",
        levelup: "border-purple-600/40 bg-gradient-to-r from-purple-900/90 to-indigo-800/90 text-purple-100 shadow-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-amber-800/40 bg-transparent px-3 text-sm font-medium transition-all hover:bg-amber-900/50 hover:border-amber-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-600/40 group-[.destructive]:hover:border-red-700/60 group-[.destructive]:hover:bg-red-900/50 group-[.destructive]:focus:ring-red-500 group-[.success]:border-emerald-600/40 group-[.success]:hover:border-emerald-700/60 group-[.success]:hover:bg-emerald-900/50 group-[.success]:focus:ring-emerald-500 group-[.warning]:border-amber-600/40 group-[.warning]:hover:border-amber-700/60 group-[.warning]:hover:bg-amber-900/50 group-[.warning]:focus:ring-amber-500 group-[.info]:border-blue-600/40 group-[.info]:hover:border-blue-700/60 group-[.info]:hover:bg-blue-900/50 group-[.info]:focus:ring-blue-500 group-[.achievement]:border-amber-500/40 group-[.achievement]:hover:border-amber-600/60 group-[.achievement]:hover:bg-amber-900/50 group-[.achievement]:focus:ring-amber-400 group-[.quest]:border-amber-600/40 group-[.quest]:hover:border-amber-700/60 group-[.quest]:hover:bg-amber-900/50 group-[.quest]:focus:ring-amber-500 group-[.levelup]:border-purple-600/40 group-[.levelup]:hover:border-purple-700/60 group-[.levelup]:hover:bg-purple-900/50 group-[.levelup]:focus:ring-purple-500",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-all hover:text-white hover:bg-gray-800/50 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 group-hover:opacity-100 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-300 group-[.destructive]:hover:bg-red-800/50 group-[.destructive]:focus:ring-red-500 group-[.success]:text-emerald-400 group-[.success]:hover:text-emerald-300 group-[.success]:hover:bg-emerald-800/50 group-[.success]:focus:ring-emerald-500 group-[.warning]:text-amber-400 group-[.warning]:hover:text-amber-300 group-[.warning]:hover:bg-amber-800/50 group-[.warning]:focus:ring-amber-500 group-[.info]:text-blue-400 group-[.info]:hover:text-blue-300 group-[.info]:hover:bg-blue-800/50 group-[.info]:focus:ring-blue-500 group-[.achievement]:text-amber-400 group-[.achievement]:hover:text-amber-300 group-[.achievement]:hover:bg-amber-800/50 group-[.achievement]:focus:ring-amber-400 group-[.quest]:text-amber-400 group-[.quest]:hover:text-amber-300 group-[.quest]:hover:bg-amber-800/50 group-[.quest]:focus:ring-amber-500 group-[.levelup]:text-purple-400 group-[.levelup]:hover:text-purple-300 group-[.levelup]:hover:bg-purple-800/50 group-[.levelup]:focus:ring-purple-500",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold text-white leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm text-gray-300 leading-relaxed mt-1", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
