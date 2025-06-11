import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Keyboard, Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Search() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2",
        )}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <span className="sr-only">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/kingdom"))}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Kingdom
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/realm"))}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Realm
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/character"))}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Character
            </CommandItem>
            <CommandSeparator />
            <CommandItem
              onSelect={() => runCommand(() => router.push("/quests"))}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Quests
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/achievements"))}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Achievements
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
} 