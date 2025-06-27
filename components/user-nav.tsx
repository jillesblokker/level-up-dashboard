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
import type { Session } from '@supabase/supabase-js'
import { useClerk, useUser } from "@clerk/nextjs";

export function UserNav() {
  const { user, isLoaded } = useUser();

  // Helper to get the avatar initial as a string
  const getAvatarInitial = () => {
    const name = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || '';
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {user?.imageUrl ? (
              <AvatarImage 
                src={user.imageUrl} 
                alt={String(user?.unsafeMetadata?.['user_name'] || user?.username || user?.emailAddresses?.[0]?.emailAddress || 'User')} 
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <AvatarFallback 
                style={{ 
                  backgroundColor: user?.unsafeMetadata?.['avatar_bg_color'] as string || "#1f2937",
                  color: user?.unsafeMetadata?.['avatar_text_color'] as string || "#ffffff"
                }}
              >
                {getAvatarInitial()}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {String(user?.unsafeMetadata?.['user_name'] || user?.username || user?.emailAddresses?.[0]?.emailAddress || '')}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {String(user?.emailAddresses?.[0]?.emailAddress || '')}
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
          <Link href="/stored-data">
            <DropdownMenuItem className="cursor-pointer" aria-label="Stored Data">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span>Stored Data</span>
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