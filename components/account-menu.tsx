import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { eventBus } from "@/app/lib/event-bus";

import { smartLogger } from "@/lib/smart-logger";
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
  Activity,
  ChevronDown,
  Bug
} from "lucide-react";

export function AccountMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileUpdateCount, setProfileUpdateCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    smartLogger.startGuideFlow();
    smartLogger.info('AccountMenu', 'GUIDE_BUTTON_CLICKED', {
      userId: user?.id,
      displayName,
      avatarType,
      isOpen,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    try {
      smartLogger.addGuideStep('BUTTON_CLICK', true, {
        component: 'AccountMenu',
        action: 'guide_button_click',
        buttonLocation: 'account_menu_dropdown',
        userContext: {
          isLoggedIn: !!user,
          hasDisplayName: !!displayName,
          avatarType
        }
      });
      
      // Reset onboarding state to ensure it can be opened again
      smartLogger.addGuideStep('RESET_ONBOARDING', true, {
        action: 'reset_onboarding_state',
        reason: 'manual_guide_button_click',
        previousState: 'will_be_cleared'
      });
      console.log('Onboarding reset temporarily disabled');
      
      smartLogger.addGuideStep('OPEN_ONBOARDING', true, {
        action: 'open_onboarding_modal',
        forceOpen: true,
        method: 'force_open_override',
        expectedBehavior: 'modal_should_open_immediately'
      });
      console.log('Onboarding open temporarily disabled');
      
      smartLogger.addGuideStep('CLOSE_DROPDOWN', true, {
        action: 'close_account_menu',
        reason: 'user_selected_guide_option'
      });
      setIsOpen(false);
      
      smartLogger.addGuideStep('GUIDE_FLOW_COMPLETE', true, {
        totalSteps: 4,
        duration: 'calculated_by_smartLogger',
        success: true
      });
      smartLogger.endGuideFlow();
      
    } catch (error) {
      smartLogger.error('AccountMenu', 'GUIDE_FLOW_ERROR', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        stepWhereErrorOccurred: 'guide_button_click_flow'
      });
      smartLogger.addGuideStep('ERROR_HANDLING', false, {}, error instanceof Error ? error.message : String(error));
      smartLogger.endGuideFlow();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.account-menu-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div className="relative account-menu-container">
      <Button 
        variant="ghost" 
        className="relative h-12 w-12 md:h-8 md:w-8 rounded-full touch-manipulation min-h-[44px] bg-transparent hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label="Account menu"
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Mobile-friendly dropdown */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 md:w-64 max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-amber-800/20 backdrop-blur-xl rounded-lg shadow-2xl z-50">
          {/* Enhanced Header */}
          <div className="p-4 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
            <div className="flex flex-col space-y-2">
              <p className="text-base font-semibold text-white leading-none">
                {String(user?.unsafeMetadata?.['user_name'] || user?.username || user?.emailAddresses?.[0]?.emailAddress || '')}
              </p>
              <p className="text-sm leading-none text-amber-400">
                {String(user?.emailAddresses?.[0]?.emailAddress || '')}
              </p>
            </div>
          </div>
          
          <div className="border-b border-amber-800/20" />
          
          {/* Enhanced Menu Items with Better Mobile Support */}
          <div className="p-2 space-y-1">
            <Link 
              href="/profile"
              className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
              aria-label="Profile page"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-5 w-5 text-amber-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">Profile</span>
                <p className="text-xs text-gray-400">Manage your profile</p>
              </div>
            </Link>
            
            <Link 
              href="/requirements"
              className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
              aria-label="Requirements page"
              onClick={() => setIsOpen(false)}
            >
              <FileText className="h-5 w-5 text-amber-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">Requirements</span>
                <p className="text-xs text-gray-400">View system requirements</p>
              </div>
            </Link>
            
            <Link 
              href="/design-system"
              className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
              aria-label="Design System page"
              onClick={() => setIsOpen(false)}
            >
              <Crown className="h-5 w-5 text-amber-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">Design System</span>
                <p className="text-xs text-gray-400">View design components</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/stored-data"
              className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
              aria-label="Admin page"
              onClick={() => setIsOpen(false)}
            >
              <Database className="h-5 w-5 text-amber-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">Admin</span>
                <p className="text-xs text-gray-400">Manage data & settings</p>
              </div>
            </Link>
            
            <Link 
              href="/account/monitoring"
              className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
              aria-label="Monitoring page"
              onClick={() => setIsOpen(false)}
            >
              <Monitor className="h-5 w-5 text-amber-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">Monitoring</span>
                <p className="text-xs text-gray-400">View performance metrics</p>
              </div>
            </Link>
            
            <Link 
              href="/settings"
              className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
              aria-label="Settings page"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-5 w-5 text-amber-400" />
              <div className="flex-1 text-left">
                <span className="text-base font-medium text-white">Settings</span>
                <p className="text-xs text-gray-400">App preferences</p>
              </div>
            </Link>
          </div>
          
          <div className="border-b border-amber-800/20" />
          
          {/* Guide Button */}
          <button
            className="w-full min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation text-left rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
            aria-label="Show guide"
            role="button"
            onClick={handleGuideClick}
          >
            <BookOpen className="h-5 w-5 text-amber-400" />
            <div className="flex-1">
              <span className="text-base font-medium text-white">Guide</span>
              <p className="text-xs text-gray-400">Open tutorial</p>
            </div>
          </button>
          
          {/* Log Center Button */}
          <Link 
            href="/account/log-center"
            className="block min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation rounded-lg hover:bg-amber-500/10 focus:bg-amber-500/10 transition-all duration-200"
            aria-label="Log Center page"
            onClick={() => setIsOpen(false)}
          >
            <Bug className="h-5 w-5 text-amber-400" />
            <div className="flex-1 text-left">
              <span className="text-base font-medium text-white">Log Center</span>
              <p className="text-xs text-gray-400">View debug logs</p>
            </div>
          </Link>
          
          <div className="border-b border-amber-800/20" />
          
          {/* Logout Button */}
          <button
            className="w-full min-h-[52px] md:min-h-[44px] flex items-center gap-3 p-3 touch-manipulation text-left rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 transition-all duration-200"
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
        </div>
      )}
    </div>
  );
}; 