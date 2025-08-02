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
import { useOnboarding } from "@/hooks/use-onboarding";
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
  const { openOnboarding } = useOnboarding();

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

  const handleGuideClick = () => {
    openOnboarding(true);
  };
  
  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-12 w-12 md:h-8 md:w-8 rounded-full touch-manipulation min-h-[44px]"
            aria-label="Account menu"
          >
            <Avatar className="h-12 w-12 md:h-8 md:w-8">
              {avatarType === 'uploaded' && user?.imageUrl ? (
                <AvatarImage src={user.imageUrl} alt="Profile" style={{ objectFit: 'cover', objectPosition: 'center' }} />
              ) : avatarType === 'default' ? (
                <img src="/images/placeholders/item-placeholder.svg" alt="Default avatar" className="h-12 w-12 md:h-8 md:w-8 rounded-full object-contain bg-gray-800" />
              ) : (
                <AvatarFallback style={{ backgroundColor: avatarBgColor, color: avatarTextColor }}>
                  {displayName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-72 md:w-64 max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-amber-800/20 backdrop-blur-xl scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent dropdown-menu-scrollable" 
          align="end" 
          forceMount
          sideOffset={8}
          style={{
            maxHeight: '80vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Enhanced Header */}
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
          
          {/* Enhanced Menu Items with Better Mobile Support */}
          <div className="p-2 space-y-1">
            <DropdownMenuItem asChild className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
              <Link 
                href="/profile"
                className="min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
                aria-label="Profile page"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Profile</span>
                  <p className="text-xs text-gray-400">Manage your profile</p>
                </div>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
              <Link 
                href="/requirements"
                className="min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
                aria-label="Requirements page"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Requirements</span>
                  <p className="text-xs text-gray-400">View system requirements</p>
                </div>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
              <Link 
                href="/design-system"
                className="min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
                aria-label="Design System page"
                onClick={() => setIsOpen(false)}
              >
                <Crown className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Design System</span>
                  <p className="text-xs text-gray-400">View design components</p>
                </div>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
              <Link 
                href="/stored-data"
                className="min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
                aria-label="Stored Data page"
                onClick={() => setIsOpen(false)}
              >
                <Database className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Stored Data</span>
                  <p className="text-xs text-gray-400">Manage local data</p>
                </div>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
              <Link 
                href="/account/monitoring"
                className="min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
                aria-label="Monitoring page"
                onClick={() => setIsOpen(false)}
              >
                <Monitor className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Monitoring</span>
                  <p className="text-xs text-gray-400">View performance metrics</p>
                </div>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
              <Link 
                href="/settings"
                className="min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation"
                aria-label="Settings page"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium text-white">Settings</span>
                  <p className="text-xs text-gray-400">App preferences</p>
                </div>
              </Link>
            </DropdownMenuItem>
          </div>
          
          <DropdownMenuSeparator className="bg-amber-800/20" />
          
          {/* Guide Button */}
          <DropdownMenuItem className="rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10">
            <button
              className="w-full min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation text-left"
              aria-label="Show guide"
              role="button"
              onClick={() => {
                handleGuideClick();
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
          
          <DropdownMenuSeparator className="bg-amber-800/20" />
          
          {/* Logout Button */}
          <DropdownMenuItem className="rounded-lg hover:bg-red-500/10 focus:bg-red-500/10">
            <button
              className="w-full min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation text-left"
              aria-label="Log out"
              role="button"
              onClick={async () => {
                setIsLoading(true);
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
              disabled={isLoading}
            >
              <LogOut className="h-5 w-5 text-red-400" />
              <div className="flex-1">
                <span className="text-base font-medium text-white">
                  {isLoading ? "Signing out..." : "Log out"}
                </span>
                <p className="text-xs text-gray-400">Sign out of your account</p>
              </div>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}; 