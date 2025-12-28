'use client'

import { useState, useEffect } from "react";
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
import { ClipboardCheck, Palette, User, Settings, Monitor, BookOpen, Database, Volume2, VolumeX, ChevronRight, Keyboard } from "lucide-react"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts"
import type { Session } from '@supabase/supabase-js'
import { useClerk, useUser } from "@clerk/nextjs";
import { useAudioContext } from "@/components/audio-provider";

import { NotificationsBell } from "@/components/notifications-bell";

export function UserNav() {
  const { user, isLoaded } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { settings, setSettings, currentMusic, isPlaying, stopMusic, toggleMusic } = useAudioContext();
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'jillesblokker@gmail.com';

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper to get the avatar initial as a string
  const getAvatarInitial = () => {
    const name = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || '';
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };



  // Guide button click handler
  const handleGuideClick = () => {
    if (typeof window !== 'undefined' && (window as any).openOnboarding) {
      console.log('Opening onboarding via guide button');
      (window as any).openOnboarding();
    } else {
      console.log('Onboarding function not available');
    }
  };

  if (!isClient || !user) {
    return null;
  }

  return (
    <div className="relative z-50">
      <DropdownMenu open={isOpen} onOpenChange={(open) => {
        console.log('[UserNav] Dropdown state changing to:', open);
        if (open) {
          (window as any).__userNavLastOpen = Date.now();
        }
        setIsOpen(open);
      }}>
        <div className="flex items-center gap-2">
          <NotificationsBell />

          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 md:h-8 md:w-8 rounded-full touch-manipulation min-h-[44px] hover:bg-amber-500/10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
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
        </div>
        <DropdownMenuContent
          className="w-screen h-screen md:w-64 md:h-auto md:max-h-[80vh] fixed top-0 left-0 md:top-auto md:left-auto md:relative z-[100] bg-gray-900/95 md:bg-gradient-to-br md:from-gray-900/95 md:to-gray-800/95 border-none md:border md:border-amber-800/20 backdrop-blur-xl overflow-y-auto"
          align="end"
          sideOffset={8}
          onInteractOutside={(e) => {
            console.log('[UserNav] Interact outside:', e.target);
            // Prevent closing if we just opened (within 100ms)
            const now = Date.now();
            const lastOpenTime = (window as any).__userNavLastOpen || 0;
            if (now - lastOpenTime < 100) {
              console.log('[UserNav] Preventing close - just opened');
              e.preventDefault();
            }
          }}
        >
          <div className="flex md:hidden items-center justify-end p-4 border-b border-amber-800/20">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-amber-500 hover:text-amber-400">
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
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
                  <p className="text-xs text-gray-400">Manage your character and settings</p>
                </div>
              </DropdownMenuItem>
            </Link>
            <Link href="/requirements">
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
                <ClipboardCheck className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Adventurer&apos;s Guide</span>
                  <p className="text-xs text-gray-400">View system requirements</p>
                </div>
              </DropdownMenuItem>
            </Link>
            {isAdmin && (
              <>
                <Link href="/design-system">
                  <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
                    <Palette className="h-5 w-5 text-amber-400" />
                    <div className="flex-1 text-left">
                      <span className="text-base font-medium text-white">Design System</span>
                      <p className="text-xs text-gray-400">View design components</p>
                    </div>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/stored-data">
                  <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation" aria-label="Stored Data">
                    <Database className="h-5 w-5 text-amber-400" />
                    <div className="flex-1 text-left">
                      <span className="text-base font-medium text-white">Stored Data</span>
                      <p className="text-xs text-gray-400">Manage local data</p>
                    </div>
                  </DropdownMenuItem>
                </Link>
              </>
            )}
            <DropdownMenuItem className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation">
              <button
                className="w-full text-left cursor-pointer flex items-center gap-3"
                aria-label="Show guide"
                role="button"
                onClick={() => {
                  handleGuideClick();
                  setIsOpen(false);
                }}
              >
                <BookOpen className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <span className="text-base font-medium text-white">Tutorial</span>
                  <p className="text-xs text-gray-400">Open interactive tutorial</p>
                </div>
              </button>
            </DropdownMenuItem>
            <KeyboardShortcutsHelp
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation cursor-pointer"
                >
                  <Keyboard className="h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <span className="text-base font-medium text-white">Shortcuts</span>
                    <p className="text-xs text-gray-400">View keyboard commands</p>
                  </div>
                </DropdownMenuItem>
              }
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-amber-800/20" />

          {/* Audio Controls Section */}
          <DropdownMenuGroup className="p-2 space-y-1">
            <DropdownMenuItem
              className="cursor-pointer rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
              onClick={() => {
                toggleMusic();
              }}
            >
              {settings.musicEnabled ? (
                <Volume2 className="h-5 w-5 text-amber-400" />
              ) : (
                <VolumeX className="h-5 w-5 text-gray-400" />
              )}
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">
                  {settings.musicEnabled ? 'Disable Audio' : 'Enable Audio'}
                </span>
                <p className="text-xs text-gray-400">
                  {settings.musicEnabled ? 'Turn off background music and sounds' : 'Turn on background music and sounds'}
                </p>
              </div>
            </DropdownMenuItem>

            {/* Disable All Audio Button */}
            <DropdownMenuItem
              className="cursor-pointer rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
              onClick={() => {
                // Disable both music and SFX
                setSettings(prev => ({
                  ...prev,
                  musicEnabled: false,
                  sfxEnabled: false
                }));
                // Stop any playing music
                stopMusic();
              }}
            >
              <VolumeX className="h-5 w-5 text-red-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">
                  Disable All Audio
                </span>
                <p className="text-xs text-gray-400">
                  Turn off all music and sound effects completely
                </p>
              </div>
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
    </div>
  );
} 