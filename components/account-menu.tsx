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

const AccountMenu = () => {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  console.log('[AccountMenu] user:', user);
  console.log('[AccountMenu] user.imageUrl:', user?.imageUrl);
  const [profileUpdateCount, setProfileUpdateCount] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      await user?.reload();
      setProfileUpdateCount((c) => c + 1);
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
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarType === 'uploaded' && user?.imageUrl ? (
              <AvatarImage src={user.imageUrl} alt="Profile" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            ) : avatarType === 'default' ? (
              <img src="/images/placeholders/item-placeholder.svg" alt="Default avatar" className="w-8 h-8 rounded-full object-contain bg-gray-800" />
            ) : (
              <AvatarFallback style={{ backgroundColor: avatarBgColor, color: avatarTextColor }}>
                {displayName?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
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
          <Link href="/account/profile">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/monitoring">
            Monitoring
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/stored-data" aria-label="Stored Data page">
            Stored Data
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            className="w-full text-left cursor-pointer"
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
              } catch (e: unknown) {
                // Ignore errors if not signed in
              }
              window.location.href = "/auth/signin";
            }}
            aria-label="Log out"
          >
            Log out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 