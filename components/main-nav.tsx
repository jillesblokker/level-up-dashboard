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
        <NavigationMenuList className="gap-1 bg-gray-900/30 backdrop-blur-sm rounded-lg p-1">
          <NavigationMenuItem>
            <Link
              href="/kingdom"
              className={cn(
                "text-base font-semibold transition-all duration-200 hover:text-amber-400 hover:bg-amber-500/10 px-3 py-2 rounded-md",
                pathname === "/kingdom" 
                  ? "text-amber-500 bg-amber-500/15 border border-amber-500/30" 
                  : "text-white"
              )}
              aria-label="Navigate to Kingdom"
              aria-current={pathname === "/kingdom" ? "page" : undefined}
            >
              Kingdom
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/quests"
              className={cn(
                "text-base font-semibold transition-all duration-200 hover:text-amber-400 hover:bg-amber-500/10 px-3 py-2 rounded-md",
                pathname?.startsWith("/quests") 
                  ? "text-amber-500 bg-amber-500/15 border border-amber-500/30" 
                  : "text-white"
              )}
              aria-label="Navigate to Tasks"
              aria-current={pathname?.startsWith("/quests") ? "page" : undefined}
            >
              Tasks
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/realm"
              className={cn(
                "text-base font-semibold transition-all duration-200 hover:text-amber-400 hover:bg-amber-500/10 px-3 py-2 rounded-md",
                pathname?.startsWith("/realm") 
                  ? "text-amber-500 bg-amber-500/15 border border-amber-500/30" 
                  : "text-white"
              )}
              aria-label="Navigate to Realm"
              aria-current={pathname?.startsWith("/realm") ? "page" : undefined}
            >
              Realm
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/achievements"
              className={cn(
                "text-base font-semibold transition-all duration-200 hover:text-amber-400 hover:bg-amber-500/10 px-3 py-2 rounded-md",
                pathname?.startsWith("/game-center") || pathname?.startsWith("/achievements") 
                  ? "text-amber-500 bg-amber-500/15 border border-amber-500/30" 
                  : "text-white"
              )}
              aria-label="Navigate to Achievements"
              aria-current={(pathname?.startsWith("/game-center") || pathname?.startsWith("/achievements")) ? "page" : undefined}
            >
              Achievements
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href="/character"
              className={cn(
                "text-base font-semibold transition-all duration-200 hover:text-amber-400 hover:bg-amber-500/10 px-3 py-2 rounded-md",
                pathname?.startsWith("/character") 
                  ? "text-amber-500 bg-amber-500/15 border border-amber-500/30" 
                  : "text-white"
              )}
              aria-label="Navigate to Character"
              aria-current={pathname?.startsWith("/character") ? "page" : undefined}
            >
              Character
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
} 