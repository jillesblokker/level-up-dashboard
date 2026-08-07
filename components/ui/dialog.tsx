"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { hapticLight } from "@/lib/haptics"


const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const MobileSheetDragHandle = () => {
  const [startY, setStartY] = React.useState<number | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const handleRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null || !e.touches[0]) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setDragY(diff);
      const dialogEl = handleRef.current?.closest('[role="dialog"]') as HTMLElement;
      if (dialogEl) {
        dialogEl.style.transform = `translateY(${diff}px)`;
        dialogEl.style.transition = 'none';
      }
    }
  };

  const handleTouchEnd = () => {
    const dialogEl = handleRef.current?.closest('[role="dialog"]') as HTMLElement;
    if (dragY > 40 && dialogEl) {
      hapticLight();
      const closeBtn = dialogEl.querySelector('button.absolute') as HTMLButtonElement;
      if (closeBtn) {
        closeBtn.click();
      }
    }
    if (dialogEl) {
      dialogEl.style.transform = '';
      dialogEl.style.transition = '';
    }
    setStartY(null);
    setDragY(0);
  };

  return (
    <div
      ref={handleRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full py-2 flex items-center justify-center cursor-grab active:cursor-grabbing sm:hidden shrink-0 touch-none"
    >
      <div className="w-12 h-1.5 bg-amber-500/40 rounded-full hover:bg-amber-400/60 transition-colors" />
    </div>
  );
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideDescription?: boolean;
    showDragHandle?: boolean;
  }
>(({ className, children, hideDescription = false, showDragHandle = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full gap-4 border border-amber-900/50 bg-zinc-950/95 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 font-serif",
        "max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:max-h-[85vh] max-sm:p-5 max-sm:pb-safe overflow-y-auto",
        "sm:left-1/2 sm:top-1/2 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-lg sm:max-h-[90vh] sm:p-6 sm:rounded-2xl",
        className
      )}
      aria-modal="true"
      role="dialog"
      aria-describedby={hideDescription ? undefined : undefined}
      {...props}
    >
      {/* iOS Sheet Interactive Touch Drag Handle for Mobile */}
      {showDragHandle && <MobileSheetDragHandle />}
      {/* Hidden description for accessibility - required by Radix */}
      <DialogPrimitive.Description className="sr-only">
        Dialog content
      </DialogPrimitive.Description>
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 z-[60] rounded-full opacity-90 transition-all hover:opacity-100 bg-zinc-950/90 border border-amber-500/30 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 h-10 w-10 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-amber-400 shadow-md">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

