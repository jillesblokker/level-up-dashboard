import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex pl-6">
      <NavigationMenu>
        <NavigationMenuList className="gap-6">
          <NavigationMenuItem>
            <Link
              href="/kingdom"
              className={cn(
                "text-sm font-semibold transition-all duration-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 px-3 py-2",
                pathname === "/kingdom" ? "text-amber-500 border-b-2 border-amber-500" : "text-white"
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
                "text-sm font-semibold transition-all duration-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 px-3 py-2",
                pathname?.startsWith("/quests") ? "text-amber-500 border-b-2 border-amber-500" : "text-white"
              )}
              aria-label="Navigate to Tasks"
            >
              Tasks
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/realm"
              className={cn(
                "text-sm font-semibold transition-all duration-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 px-3 py-2",
                pathname?.startsWith("/realm") ? "text-amber-500 border-b-2 border-amber-500" : "text-white"
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
                "text-sm font-semibold transition-all duration-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 px-3 py-2",
                pathname?.startsWith("/game-center") || pathname?.startsWith("/achievements") ? "text-amber-500 border-b-2 border-amber-500" : "text-white"
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
                "text-sm font-semibold transition-all duration-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 px-3 py-2",
                pathname?.startsWith("/character") ? "text-amber-500 border-b-2 border-amber-500" : "text-white"
              )}
              aria-label="Navigate to Character"
            >
              Character
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
} 