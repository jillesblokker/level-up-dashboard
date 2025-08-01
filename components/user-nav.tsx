'use client'

import { useState } from "react";
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
import { logout } from '@/app/actions/auth'
import Link from "next/link"
import { ClipboardCheck, Palette, User, Settings, Monitor, BookOpen, Database } from "lucide-react"
import type { Session } from '@supabase/supabase-js'
import { useClerk, useUser } from "@clerk/nextjs";
import { useOnboarding } from "@/hooks/use-onboarding";

export function UserNav() {
  const { user, isLoaded } = useUser();
  const { openOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to get the avatar initial as a string
  const getAvatarInitial = () => {
    const name = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || '';
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };

  // Full onboarding function
  const openFullOnboarding = () => {
    openOnboarding(true); // Force open the full onboarding
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="relative h-10 w-10 md:h-8 md:w-8 rounded-full touch-manipulation min-h-[44px]">
            <Avatar className="h-10 w-10 md:h-8 md:w-8">
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
        <DropdownMenuContent 
          className="w-72 md:w-64 max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-amber-800/20 backdrop-blur-xl" 
          align="end" 
          forceMount
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal p-4 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
            <div className="flex flex-col space-y-2">
              <p className="text-base font-semibold text-white leading-none">
                {String(user?.unsafeMetadata?.['user_name'] || user?.username || user?.emailAddresses?.[0]?.emailAddress || '')}
              </p>
              <p className="text-sm leading-none text-amber-400">
                {String(user?.emailAddresses?.[0]?.emailAddress || '')}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-amber-800/20" />
          <DropdownMenuGroup className="p-2 space-y-1">
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
                <User className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Profile</span>
                  <p className="text-xs text-gray-400">Manage your profile</p>
                </div>
              </DropdownMenuItem>
            </Link>
            <Link href="/requirements">
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
                <ClipboardCheck className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Requirements</span>
                  <p className="text-xs text-gray-400">View system requirements</p>
                </div>
              </DropdownMenuItem>
            </Link>
            <Link href="/design-system">
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
                <Palette className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Design System</span>
                  <p className="text-xs text-gray-400">View design components</p>
                </div>
              </DropdownMenuItem>
            </Link>
            <Link href="/stored-data">
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation" aria-label="Stored Data">
                <Database className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Stored Data</span>
                  <p className="text-xs text-gray-400">Manage local data</p>
                </div>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
              <button
                className="w-full text-left cursor-pointer flex items-center gap-3"
                aria-label="Show guide"
                role="button"
                onClick={() => {
                  openFullOnboarding();
                  setIsOpen(false);
                }}
              >
                <BookOpen className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <span className="text-base font-medium text-white">Guide</span>
                  <p className="text-xs text-gray-400">Open tutorial</p>
                </div>
              </button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-amber-800/20" />
          <form action={logout}>
            <DropdownMenuItem asChild className="rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
              <button className="w-full text-left cursor-pointer flex items-center gap-3">
                <Settings className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <span className="text-base font-medium text-white">Log out</span>
                  <p className="text-xs text-gray-400">Sign out of your account</p>
                </div>
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 