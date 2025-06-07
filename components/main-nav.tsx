import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GameFeatures } from "@/components/game-features"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <NavigationMenu>
        <NavigationMenuList className="gap-6">
          <NavigationMenuItem>
            <Link
              href="/kingdom"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                pathname === "/kingdom" ? "text-foreground" : "text-foreground/60"
              )}
              aria-label="Navigate to Kingdom"
            >
              Kingdom
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/quests"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                pathname?.startsWith("/quests") ? "text-foreground" : "text-foreground/60"
              )}
              aria-label="Navigate to Quests"
            >
              Quests
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/realm"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                pathname?.startsWith("/realm") ? "text-foreground" : "text-foreground/60"
              )}
              aria-label="Navigate to Realm"
            >
              Realm
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/achievements"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                pathname?.startsWith("/game-center") || pathname?.startsWith("/achievements") ? "text-foreground" : "text-foreground/60"
              )}
              aria-label="Navigate to Achievements"
            >
              Achievements
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/character"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                pathname?.startsWith("/character") ? "text-foreground" : "text-foreground/60"
              )}
              aria-label="Navigate to Character"
            >
              Character
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/guildhall"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                pathname?.startsWith("/guildhall") ? "text-foreground" : "text-foreground/60"
              )}
              aria-label="Navigate to Guildhall"
            >
              Guildhall
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
} 