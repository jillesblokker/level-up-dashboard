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
// import { useSession } from "next-auth/react"
import { logout } from '@/app/actions/auth'
import Link from "next/link"
import { ClipboardCheck, Palette, User, Settings, Monitor, BookOpen } from "lucide-react"
import type { Session } from '@supabase/supabase-js'
import { useClerk, useUser } from "@clerk/nextjs";
// Removed old onboarding system
// import { useOnboarding } from "@/hooks/use-onboarding";

export function UserNav() {
  const { user, isLoaded } = useUser();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  // Removed old onboarding system
  // const { openOnboarding } = useOnboarding();

  // Helper to get the avatar initial as a string
  const getAvatarInitial = () => {
    const name = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || '';
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };

  // Simple onboarding modal function
  const openSimpleOnboardingModal = () => {
    console.log('UserNav: Opening simple onboarding modal');
    setShowOnboardingModal(true);
  };

  return (
    <>
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
            <Link href="/stored-data">
              <DropdownMenuItem className="cursor-pointer" aria-label="Stored Data">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                <span>Stored Data</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem>
              <button
                className="w-full text-left cursor-pointer flex items-center"
                aria-label="Show guide"
                role="button"
                onClick={openSimpleOnboardingModal}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Guide</span>
              </button>
            </DropdownMenuItem>
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

      {/* Simple Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-amber-800/20 shadow-2xl rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Thrivehaven</h2>
              <p className="text-amber-400 text-lg">Every adventure is in need for a quest to achieve greatness</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/50 border border-amber-800/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Complete Quests</h3>
                <p className="text-gray-300">Transform daily habits into epic adventures and earn gold and experience.</p>
              </div>
              
              <div className="bg-gray-800/50 border border-amber-800/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Build Your Kingdom</h3>
                <p className="text-gray-300">Buy tiles and create a realm that grows with your progress.</p>
              </div>
              
              <div className="bg-gray-800/50 border border-amber-800/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Level Up & Unlock</h3>
                <p className="text-gray-300">Gain experience and unlock new content as you progress.</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowOnboardingModal(false)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg"
              >
                Start Your Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 