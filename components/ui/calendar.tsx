"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DayProps } from "react-day-picker" // RDP v9

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  entryDays?: Date[]; // List of dates that have entries
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  entryDays = [],
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      modifiers={{
        hasEntry: entryDays
      }}
      modifiersClassNames={{
        hasEntry: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-amber-500 after:rounded-full"
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-base font-serif font-bold text-amber-500",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-amber-900/30 text-amber-500"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse", // Removed flex/block hacks
        head_row: "grid grid-cols-7 w-full", // Use grid for alignment
        head_cell:
          "text-zinc-500 rounded-md font-normal text-[0.8rem] flex justify-center items-center h-9", // removed w-9 fixed width
        row: "grid grid-cols-7 w-full mt-2", // Use grid for dates
        cell: "h-9 w-full flex justify-center items-center text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-zinc-300 hover:text-amber-500 hover:bg-amber-950/30"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-amber-600 text-white hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white rounded-md",
        day_today: "bg-zinc-800 text-amber-200 rounded-md",
        day_outside:
          "day-outside text-zinc-700 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
