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
import { BookOpen } from "lucide-react";

export function AccountMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileUpdateCount, setProfileUpdateCount] = useState(0);
  const { openOnboarding, debugOnboardingState } = useOnboarding();

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

  return (
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
            onClick={() => {
              console.log('Guide button clicked - opening onboarding')
              openOnboarding()
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Guide
          </button>
        </DropdownMenuItem>
        {process.env.NODE_ENV === 'development' && (
          <DropdownMenuItem>
            <button
              className="w-full text-left cursor-pointer min-h-[44px] md:min-h-[36px] flex items-center touch-manipulation"
              aria-label="Debug onboarding"
              role="button"
              onClick={() => debugOnboardingState()}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Debug Onboarding
            </button>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
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
  );
}; 