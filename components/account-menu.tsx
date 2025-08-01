import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { eventBus } from "@/app/lib/event-bus";
// Removed old onboarding system
// import { useOnboarding } from "@/hooks/use-onboarding";
import { 
  BookOpen, 
  User, 
  Settings, 
  LogOut, 
  Crown, 
  BarChart3, 
  FileText, 
  Database,
  Monitor,
  Activity
} from "lucide-react";

export function AccountMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileUpdateCount, setProfileUpdateCount] = useState(0);
  // Removed old onboarding system
  // const { openOnboarding, debugOnboardingState, resetOnboarding } = useOnboarding();
  
  // Simple test modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      await user?.reload();
      setProfileUpdateCount((c: number) => c + 1);
    };
    eventBus.on("profile-updated", refresh);
    return () => eventBus.off("profile-updated", refresh);
  }, [user]);

  // Get display name and avatar colors from Clerk user metadata, fallback to email/username
  const displayName = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || "";
  const avatarBgColor = user?.unsafeMetadata?.['avatar_bg_color'] as string || "#1f2937";
  const avatarTextColor = user?.unsafeMetadata?.['avatar_text_color'] as string || "#ffffff";
  const avatarType = (user?.unsafeMetadata?.['avatar_type'] as 'initial' | 'default' | 'uploaded') || (user?.imageUrl ? 'uploaded' : 'initial');



  // Simple test modal function
  const openSimpleTestModal = () => {
    setShowTestModal(true);
  };

  // Simple onboarding modal function
  const openSimpleOnboardingModal = () => {
    setShowOnboardingModal(true);
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-10 w-10 md:h-8 md:w-8 rounded-full touch-manipulation"
            aria-label="Account menu"
          >
            <Avatar className="h-10 w-10 md:h-8 md:w-8">
              {avatarType === 'uploaded' && user?.imageUrl ? (
                <AvatarImage src={user.imageUrl} alt="Profile" style={{ objectFit: 'cover', objectPosition: 'center' }} />
              ) : avatarType === 'default' ? (
                <img src="/images/placeholders/item-placeholder.svg" alt="Default avatar" className="h-10 w-10 md:h-8 md:w-8 rounded-full object-contain bg-gray-800" />
              ) : (
                <AvatarFallback style={{ backgroundColor: avatarBgColor, color: avatarTextColor }}>
                  {displayName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 md:w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">User</p>
              <p className="text-xs leading-none text-muted-foreground">
                user@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link 
              href="/account/profile"
              className="min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Profile page"
            >
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link 
              href="/account/monitoring"
              className="min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Monitoring page"
            >
              Monitoring
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link 
              href="/requirements" 
              className="min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Requirements page"
            >
              Requirements
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link 
              href="/design-system" 
              className="min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Design System page"
            >
              Design System
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link 
              href="/account/stored-data" 
              className="min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Stored Data page"
            >
              Stored Data
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              className="w-full text-left cursor-pointer min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Show guide"
              role="button"
              onClick={openSimpleOnboardingModal}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guide
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              className="w-full text-left cursor-pointer min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Test simple modal"
              role="button"
              onClick={openSimpleTestModal}
            >
              <FileText className="h-4 w-4 mr-2" />
              Test Simple Modal
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              className="w-full text-left cursor-pointer min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Log out"
              role="button"
              onClick={async () => {
                // Remove guest mode flags
                if (typeof window !== "undefined") {
                  localStorage.removeItem("skip-auth");
                }
                if (typeof document !== "undefined") {
                  document.cookie = "skip-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                }
                // Clerk sign out (if signed in)
                try {
                  await signOut();
                } catch (e) {}
                // Redirect to a public page (not protected)
                window.location.href = "/auth/signin";
              }}
            >
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Simple Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">Simple Test Modal</h2>
            <p className="text-gray-600 mb-4">
              This is a simple test modal to verify modal rendering works correctly.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
}; 