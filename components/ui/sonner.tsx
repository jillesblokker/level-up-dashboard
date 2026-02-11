"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-950 group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-2xl font-serif",
          description: "group-[.toast]:text-zinc-400 font-sans",
          actionButton:
            "group-[.toast]:bg-amber-600 group-[.toast]:text-amber-50 group-[.toast]:hover:bg-amber-500",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400 group-[.toast]:hover:bg-zinc-700",
          success:
            "group-[.toaster]:bg-emerald-950 group-[.toaster]:text-emerald-50 group-[.toaster]:border-emerald-800/50",
          error:
            "group-[.toaster]:bg-red-950 group-[.toaster]:text-red-50 group-[.toaster]:border-red-800/50",
          warning:
            "group-[.toaster]:bg-amber-950 group-[.toaster]:text-amber-50 group-[.toaster]:border-amber-800/50",
          info:
            "group-[.toaster]:bg-blue-950 group-[.toaster]:text-blue-50 group-[.toaster]:border-blue-800/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
