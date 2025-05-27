'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { useSession } from "next-auth/react"
import { logout } from '@/app/actions/auth'
import Link from "next/link"
import { ClipboardCheck, Palette, User, Settings, Monitor } from "lucide-react"

export function UserNav({ session }: { session: any }) {
  // const { data: session } = useSession()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={session?.user?.user_metadata?.avatar_url || ""} 
              alt={session?.user?.user_metadata?.user_name || session?.user?.email || ""} 
            />
            <AvatarFallback 
              style={{ 
                backgroundColor: session?.user?.user_metadata?.avatar_bg_color || "#1f2937",
                color: session?.user?.user_metadata?.avatar_text_color || "#ffffff"
              }}
            >
              {session?.user?.user_metadata?.user_name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session?.user?.user_metadata?.user_name || session?.user?.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/requirements">
            <DropdownMenuItem className="cursor-pointer">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span>Requirements</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/design-system">
            <DropdownMenuItem className="cursor-pointer">
              <Palette className="mr-2 h-4 w-4" />
              <span>Design System</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/server-checks">
            <DropdownMenuItem className="cursor-pointer" aria-label="Server Checks">
              <Monitor className="mr-2 h-4 w-4" />
              <span>Server Checks</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button className="w-full text-left cursor-pointer">
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 