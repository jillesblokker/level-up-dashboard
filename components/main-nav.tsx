import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/kingdom"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/kingdom" ? "text-foreground" : "text-foreground/60"
          )}
        >
          Kingdom
        </Link>
        <Link
          href="/realm"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/realm") ? "text-foreground" : "text-foreground/60"
          )}
        >
          Realm
        </Link>
        <Link
          href="/character"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/character") ? "text-foreground" : "text-foreground/60"
          )}
        >
          Character
        </Link>
        <Link
          href="/quests"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/quests") ? "text-foreground" : "text-foreground/60"
          )}
        >
          Quests
        </Link>
        <Link
          href="/achievements"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/achievements") ? "text-foreground" : "text-foreground/60"
          )}
        >
          Achievements
        </Link>
        <Link
          href="/guildhall"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/guildhall") ? "text-foreground" : "text-foreground/60"
          )}
        >
          Guildhall
        </Link>
      </nav>
    </div>
  )
} 