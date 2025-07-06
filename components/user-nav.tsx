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

// Commented out Clerk-dependent user property accesses for local debugging
// Remove or replace all user.unsafeMetadata, user.username, user.emailAddresses, user.imageUrl, etc.
// Example placeholder:
const username = 'Local User';
const email = 'local@example.com';
const avatarUrl = '';

const signOut = async () => {};

export function UserNav() {
  // Helper to get the avatar initial as a string
  const getAvatarInitial = () => {
    // Commented out Clerk-dependent user property accesses for local debugging
    // Remove or replace all user.unsafeMetadata, user.username, user.emailAddresses, user.imageUrl, etc.
    // Example placeholder:
    const name = username || email || '';
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <AvatarImage 
                src={avatarUrl} 
                alt={String(username || email || '')} 
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <AvatarFallback 
                style={{ 
                  backgroundColor: '#1f2937',
                  color: '#ffffff'
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
              {String(username || email || '')}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {String(email || '')}
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