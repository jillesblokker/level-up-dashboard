"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { eventBus } from "@/app/lib/event-bus";
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogHeader, DialogClose } from '@/components/ui/dialog';
import { getCroppedImg } from '../../app/lib/cropImage';
import type { Area } from 'react-easy-crop';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Shield, Sword, User, Palette, Camera, Save, Settings, Volume2, VolumeX, BookOpen, ClipboardCheck, Database, X, Trash2, AlertTriangle, Coins, Compass } from "lucide-react";
import { useAudioContext } from "@/components/audio-provider";
import { setUserPreference, getUserPreference } from "@/lib/user-preferences-manager";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { NotificationCenter } from "@/components/notification-center";
import { notificationService } from "@/lib/notification-service";
import { getCharacterStats, fetchFreshCharacterStats, CharacterStats as ServiceCharacterStats } from "@/lib/character-stats-service";
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character";
import { Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { TEXT_CONTENT } from '@/lib/text-content';
import ProfileLoading from './loading';


const placeholderSvg = "/images/placeholders/item-placeholder.svg";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { settings, setSettings, stopMusic, toggleMusic } = useAudioContext();
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'jillesblokker@gmail.com';
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState((user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses[0]?.emailAddress || "");
  const [avatarBgColor, setAvatarBgColor] = useState(user?.unsafeMetadata?.['avatar_bg_color'] as string || "#1f2937");
  const [avatarTextColor, setAvatarTextColor] = useState(user?.unsafeMetadata?.['avatar_text_color'] as string || "#ffffff");
  const [isSaving, setIsSaving] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [avatarType, setAvatarType] = useState<'initial' | 'default' | 'uploaded'>((user?.unsafeMetadata?.['avatar_type'] as 'initial' | 'default' | 'uploaded') || (user?.imageUrl ? 'uploaded' : 'initial'));

  // New state for Quick Access
  const [unreadCount, setUnreadCount] = useState(0);
  const [characterStats, setCharacterStats] = useState<any>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 0
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [dayNightEnabled, setDayNightEnabled] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [animationQuality, setAnimationQuality] = useState<'high' | 'low'>('high');

  useEffect(() => {
    // Load notifications count
    setUnreadCount(notificationService.getUnreadCount());
    const handleNewNotification = () => setUnreadCount(notificationService.getUnreadCount());
    window.addEventListener('newNotification', handleNewNotification);

    // Load character stats
    const loadStats = async () => {
      const localStats = getCharacterStats();
      if (localStats) {
        const currentLevel = calculateLevelFromExperience(localStats.experience);
        setCharacterStats({
          ...localStats,
          level: currentLevel,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel)
        });
      }

      const freshStats = await fetchFreshCharacterStats();
      if (freshStats) {
        const currentLevel = calculateLevelFromExperience(freshStats.experience);
        setCharacterStats({
          ...freshStats,
          level: currentLevel,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel)
        });
      }
    };
    loadStats();

    // Load Day/Night preference
    const savedDayNight = localStorage.getItem("day-night-cycle-enabled");
    if (savedDayNight !== null) {
      setDayNightEnabled(savedDayNight === "true");
    }

    // Sync from Supabase
    getUserPreference("day-night-cycle-enabled").then(val => {
      if (val !== null && val !== undefined) {
        const isEnabled = Boolean(val);
        setDayNightEnabled(isEnabled);
        localStorage.setItem("day-night-cycle-enabled", String(isEnabled));
      }
    });

    // Load Zen Mode
    const savedZen = localStorage.getItem("zen-mode");
    if (savedZen !== null) {
      const isZen = savedZen === "true";
      setZenMode(isZen);
      if (isZen) document.body.classList.add('zen-mode');
    }
    getUserPreference("zen-mode").then(val => {
      if (val !== null && val !== undefined) {
        const isZen = Boolean(val);
        setZenMode(isZen);
        localStorage.setItem("zen-mode", String(isZen));
        if (isZen) document.body.classList.add('zen-mode');
        else document.body.classList.remove('zen-mode');
      }
    });

    // Load Animation Quality
    const savedAnim = localStorage.getItem("animation-quality");
    if (savedAnim !== null) {
      setAnimationQuality(savedAnim as 'high' | 'low');
      if (savedAnim === 'low') document.body.classList.add('fx-low');
    }
    getUserPreference("animation-quality").then(val => {
      if (typeof val === 'string' && (val === 'high' || val === 'low')) {
        const quality = val as 'high' | 'low';
        setAnimationQuality(quality);
        localStorage.setItem("animation-quality", quality);
        if (quality === 'low') document.body.classList.add('fx-low');
        else document.body.classList.remove('fx-low');
      }
    });

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  // Guide button click handler
  const handleGuideClick = () => {
    if (typeof window !== 'undefined' && (window as any).openOnboarding) {
      logger.debug('Opening onboarding via guide button');
      (window as any).openOnboarding();
    } else {
      logger.debug('Onboarding function not available');
    }
  };

  useEffect(() => {
    // Log user and isLoaded for debugging
    // eslint-disable-next-line no-console
    // Removed debugging log
  }, [user, isLoaded]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    setSelectedImage(file);
    setShowCropper(true);
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], selectedImage.name, { type: croppedBlob.type });
      await user?.setProfileImage({ file: croppedFile });
      await user?.reload();
      setDisplayName((user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses[0]?.emailAddress || "");
      setAvatarBgColor(user?.unsafeMetadata?.['avatar_bg_color'] as string || "#1f2937");
      setAvatarTextColor(user?.unsafeMetadata?.['avatar_text_color'] as string || "#ffffff");
      setAvatarType((user?.unsafeMetadata?.['avatar_type'] as 'initial' | 'default' | 'uploaded') || (user?.imageUrl ? 'uploaded' : 'initial'));
      eventBus.emit("profile-updated");
      toast.success("Avatar updated successfully");
      setShowCropper(false);
      setSelectedImage(null);
    } catch (error) {
      toast.error("Failed to update avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      await user.update({
        unsafeMetadata: {
          user_name: displayName,
          avatar_bg_color: avatarBgColor,
          avatar_text_color: avatarTextColor,
          avatar_type: avatarType,
        },
      });
      await user.reload();
      setDisplayName((user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses[0]?.emailAddress || "");
      setAvatarBgColor(user?.unsafeMetadata?.['avatar_bg_color'] as string || "#1f2937");
      setAvatarTextColor(user?.unsafeMetadata?.['avatar_text_color'] as string || "#ffffff");
      setAvatarType((user?.unsafeMetadata?.['avatar_type'] as 'initial' | 'default' | 'uploaded') || (user?.imageUrl ? 'uploaded' : 'initial'));
      eventBus.emit("profile-updated");
      toast.success("Profile updated successfully");
    } catch (error) {
      logger.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Verify user typed "DELETE" correctly
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setIsDeleting(true);

      // Call the delete account API
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear all localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

      toast.success("Account deleted successfully. Redirecting...");

      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      logger.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (!isLoaded) {
    return <ProfileLoading />;
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-16 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl h-80 flex flex-col items-center justify-center text-center rounded-lg overflow-hidden mb-8">
          {/* Hero background with medieval theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-zinc-900 to-black/80" />
          <div className="absolute inset-0 bg-[url('/images/headers/kingdom-header.webp')] bg-cover bg-center opacity-20" />

          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          <div className="absolute top-4 right-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-8">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-amber-500/30">
              <User className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-amber-400 mb-4 drop-shadow-lg">{TEXT_CONTENT.profile.signIn.title}</h2>
            <p className="text-zinc-300 mb-6 text-lg leading-relaxed">{TEXT_CONTENT.profile.signIn.description}</p>
            <Button
              className="bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold rounded-lg px-8 py-3 text-lg hover:from-amber-600 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
              aria-label="Sign in to profile"
              onClick={() => window.location.href = '/auth/signin'}
            >
              <Crown className="w-5 h-5" />
              {TEXT_CONTENT.profile.signIn.button}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container max-w-4xl py-8 pb-24 md:pb-8" aria-label="profile-settings-section">
      {/* Hero Section */}
      <div className="relative mb-8 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-zinc-900 to-black/80" />
        <div className="absolute inset-0 bg-[url('/images/headers/kingdom-header.webp')] bg-cover bg-center opacity-30" />

        {/* Decorative border elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-amber-500 to-transparent" />
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-amber-500 to-transparent" />

        <div className="relative z-10 p-8 flex items-center space-x-6">
          {/* Large Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-amber-500/30 overflow-hidden bg-zinc-900 shadow-lg">
              {avatarType === 'uploaded' && user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
              ) : avatarType === 'default' ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <Image src={placeholderSvg} alt="Default avatar" width={48} height={48} className="w-12 h-12 object-contain opacity-70" />
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: avatarBgColor, color: avatarTextColor }}
                >
                  {displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {displayName || user?.username || 'Adventurer'}
            </h1>
            <p className="text-amber-400 mb-3 flex items-center">
              <Shield className="w-4 h-4" />
              {TEXT_CONTENT.profile.hero.role}
            </p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30 w-fit">
                <Sword className="w-3 h-3 mr-1" />
                {TEXT_CONTENT.profile.hero.active}
              </Badge>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 w-fit truncate max-w-[calc(100vw-8rem)] sm:max-w-full">
                {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content        </div>

        {/* Quick Access Cards - Mobile/Tablet Optimization */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <NotificationCenter>
          <Card className="bg-zinc-900 border-amber-800/30 hover:bg-zinc-800/80 hover:border-amber-500/50 transition-all cursor-pointer h-full group">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <div className="relative">
                <Bell className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="text-sm font-bold text-white">{TEXT_CONTENT.profile.quickAccess.inbox.title}</div>
              {unreadCount > 0 ? (
                <Badge className="mt-2 bg-red-500 hover:bg-red-600 border-none">{unreadCount} New</Badge>
              ) : (
                <span className="text-xs text-zinc-500 mt-1">{TEXT_CONTENT.profile.quickAccess.inbox.empty}</span>
              )}
            </CardContent>
          </Card>
        </NotificationCenter>

        <Link href="/character">
          <Card className="bg-zinc-900 border-amber-800/30 hover:bg-zinc-800/80 hover:border-amber-500/50 transition-all cursor-pointer h-full group">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <User className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-bold text-white">{TEXT_CONTENT.profile.quickAccess.character.title}</div>
              <div className="text-xs text-amber-400/80 mt-1 font-mono">{TEXT_CONTENT.profile.quickAccess.character.level.replace('{level}', characterStats.level.toString())}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="avatar" className="w-full space-y-6">
        <TabsList 
          className="flex h-14 bg-zinc-950 border border-amber-900/20 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto overflow-y-hidden justify-start no-scrollbar  gap-2 md:gap-0"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x' }}
        >
          <TabsTrigger value="avatar" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px]">
            <Camera className="w-4 h-4" />
            <span>{TEXT_CONTENT.profile.tabs.avatar}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px]">
            <User className="w-4 h-4" />
            <span>{TEXT_CONTENT.profile.tabs.profile}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px]">
            <Palette className="w-4 h-4" />
            <span>{TEXT_CONTENT.profile.tabs.colors}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px]">
            <Settings className="w-4 h-4" />
            <span>{TEXT_CONTENT.profile.tabs.settings}</span>
          </TabsTrigger>
          <Link href="/chronicle" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/5 lg:landscape:hidden">
            <BookOpen className="w-4 h-4" />
            <span>Logbook</span>
          </Link>
          <Link href="/market" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/5 lg:landscape:hidden">
            <Coins className="w-4 h-4" />
            <span>Market</span>
          </Link>
          <Link href="/daily-hub" className="flex items-center gap-1.5 px-3.5 md:px-6 h-full rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/5 lg:landscape:hidden">
            <Compass className="w-4 h-4" />
            <span>Daily Hub</span>
          </Link>
        </TabsList>


        <TabsContent value="avatar" className="space-y-6">
          <Card className="bg-zinc-900 border-amber-800/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-amber-400 flex items-center gap-2.5 font-bold">
                <Camera className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{TEXT_CONTENT.profile.avatar.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Selection */}
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-3 block">Choose avatar type</Label>
                <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 items-start py-1">
                  {/* Initial Avatar */}
                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 group transition-all duration-200 focus:outline-none"
                    onClick={() => setAvatarType('initial')}
                    aria-label="Use initial avatar"
                  >
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                        avatarType === 'initial'
                          ? 'border-amber-500 ring-2 ring-amber-500/40 ring-offset-2 ring-offset-zinc-900 scale-105'
                          : 'border-amber-800/30 group-hover:border-amber-500/50'
                      }`}
                      style={{ backgroundColor: avatarBgColor }}
                    >
                      <span style={{ color: avatarTextColor, fontSize: 24, fontWeight: 700 }}>
                        {displayName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                      avatarType === 'initial' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                    }`}>
                      Initial
                    </span>
                  </button>

                  {/* Default Avatar */}
                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 group transition-all duration-200 focus:outline-none"
                    onClick={() => setAvatarType('default')}
                    aria-label="Use default avatar"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all duration-200 bg-zinc-800 ${
                      avatarType === 'default'
                        ? 'border-amber-500 ring-2 ring-amber-500/40 ring-offset-2 ring-offset-zinc-900 scale-105'
                        : 'border-amber-800/30 group-hover:border-amber-500/50'
                    }`}>
                      <Image src={placeholderSvg} alt="Default avatar" width={36} height={36} className="w-9 h-9 object-contain opacity-70" />
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                      avatarType === 'default' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                    }`}>
                      Default
                    </span>
                  </button>

                  {/* Uploaded Avatar */}
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-2 group transition-all duration-200 focus:outline-none ${!user?.imageUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => user?.imageUrl && setAvatarType('uploaded')}
                    aria-label="Use uploaded avatar"
                    disabled={!user?.imageUrl}
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all duration-200 bg-zinc-900 overflow-hidden ${
                      avatarType === 'uploaded'
                        ? 'border-amber-500 ring-2 ring-amber-500/40 ring-offset-2 ring-offset-zinc-900 scale-105'
                        : 'border-amber-800/30 group-hover:border-amber-500/50'
                    }`}>
                      {user?.imageUrl ? (
                        <Image src={user.imageUrl} alt="Uploaded avatar" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-500 text-xs">No image</span>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                      avatarType === 'uploaded' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                    }`}>
                      {TEXT_CONTENT.profile.avatar.types.custom}
                    </span>
                  </button>
                </div>
              </div>

              {/* Upload Section for Custom Avatar */}
              {avatarType === 'uploaded' && (
                <div className="space-y-3">
                  <Label htmlFor="avatar" className="text-sm font-medium text-zinc-300">{TEXT_CONTENT.profile.avatar.upload.label}</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="avatar"
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                      className="flex-1"
                      aria-label="profile-picture-upload"
                      autoComplete="photo"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      className="border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
                    >
                      {isUploading ? TEXT_CONTENT.profile.avatar.upload.uploading : TEXT_CONTENT.profile.avatar.upload.button}
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {TEXT_CONTENT.profile.avatar.upload.note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-zinc-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="text-xl text-amber-400 flex items-center">
                <User className="w-5 h-5" />
                {TEXT_CONTENT.profile.info.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-zinc-300">Display Name</Label>
                <Input
                  id="name"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="max-w-md"
                  aria-label="display-name-input"
                  autoComplete="name"
                  placeholder="Enter your display name"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-300">Email Address</Label>
                <div className="bg-zinc-800/50 text-white rounded-md px-3 py-2 border border-amber-800/20 max-w-md">
                  {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''}
                </div>
                <p className="text-sm text-zinc-400">Email address is managed by your authentication provider.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-zinc-900 border-amber-800/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-amber-400 flex items-center gap-2.5 font-bold">
                <Palette className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{TEXT_CONTENT.profile.appearance.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {avatarType === 'initial' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="avatarBgColor" className="text-sm font-medium text-zinc-300">Background Color</Label>
                    <div className="flex items-center gap-3 max-w-md">
                      <Input
                        id="avatarBgColor"
                        name="avatarBgColor"
                        type="color"
                        value={avatarBgColor}
                        onChange={(e) => setAvatarBgColor(e.target.value)}
                        className="w-16 h-12 p-1 rounded-md border-amber-800/30"
                        aria-label="avatar-background-color"
                        autoComplete="off"
                      />
                      <Input
                        id="avatarBgColorText"
                        name="avatarBgColorText"
                        type="text"
                        value={avatarBgColor}
                        onChange={(e) => setAvatarBgColor(e.target.value)}
                        className="flex-1"
                        aria-label="avatar-background-color-text"
                        autoComplete="off"
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="avatarTextColor" className="text-sm font-medium text-zinc-300">Text Color</Label>
                    <div className="flex items-center gap-3 max-w-md">
                      <Input
                        id="avatarTextColor"
                        name="avatarTextColor"
                        type="color"
                        value={avatarTextColor}
                        onChange={(e) => setAvatarTextColor(e.target.value)}
                        className="w-16 h-12 p-1 rounded-md border-amber-800/30"
                        aria-label="avatar-text-color"
                        autoComplete="off"
                      />
                      <Input
                        id="avatarTextColorText"
                        name="avatarTextColorText"
                        type="text"
                        value={avatarTextColor}
                        onChange={(e) => setAvatarTextColor(e.target.value)}
                        className="flex-1"
                        aria-label="avatar-text-color-text"
                        autoComplete="off"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-300">Preview</Label>
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-amber-500/30"
                        style={{ backgroundColor: avatarBgColor }}
                      >
                        <span style={{ color: avatarTextColor, fontSize: 24, fontWeight: 700 }}>
                          {displayName?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-400">
                        This is how your avatar will appear in the realm.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Palette className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                  <p className="text-zinc-400">{TEXT_CONTENT.profile.appearance.unavailable.title}</p>
                  <p className="text-sm text-zinc-500 mt-2">{TEXT_CONTENT.profile.appearance.unavailable.subtitle}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-zinc-900 border-amber-800/30 text-white shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-amber-400 font-serif flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Unified Realm Settings Portal
                  </CardTitle>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage your visual theme, audio preferences, profile credentials, and game settings without duplication.
                  </p>
                </div>
                <Link href="/settings">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs gap-1.5 cursor-pointer">
                    <Settings className="w-4 h-4" /> Open Full Settings
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Link href="/settings?tab=appearance" className="block group">
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-amber-800/20 hover:border-amber-500/50 hover:bg-amber-950/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300">Visual Aesthetic Theme</h4>
                      <p className="text-xs text-zinc-400">Classic Dark vs Medieval RPG (Sword & Staff)</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/settings?tab=audio" className="block group">
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-amber-800/20 hover:border-amber-500/50 hover:bg-amber-950/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300">Audio & Sound FX</h4>
                      <p className="text-xs text-zinc-400">Background music, SFX & volume controls</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/settings?tab=profile" className="block group">
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-amber-800/20 hover:border-amber-500/50 hover:bg-amber-950/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-blue-300">Profile & Credentials</h4>
                      <p className="text-xs text-zinc-400">Display name, email & OAuth providers</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/settings?tab=preferences" className="block group">
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-amber-800/20 hover:border-amber-500/50 hover:bg-amber-950/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-purple-300">Game Preferences</h4>
                      <p className="text-xs text-zinc-400">Vacation shield & daily habit targets</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold rounded-lg px-8 py-3 hover:from-amber-600 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
          aria-label="Save profile changes"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>

      {/* Avatar Cropper Modal */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent role="dialog" aria-label="profile-modal" className="sm:max-w-4xl">
          <DialogDescription id="profile-modal-desc">{TEXT_CONTENT.profile.avatar.cropper.description}</DialogDescription>
          <DialogTitle className="text-xl text-amber-400 mb-4">{TEXT_CONTENT.profile.avatar.cropper.title}</DialogTitle>
          {selectedImage && (
            <div style={{ position: 'relative', width: '100%', height: 400 }} className="rounded-lg overflow-hidden border border-amber-800/20">
              <Cropper
                image={URL.createObjectURL(selectedImage)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1f2937'
                  }
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => setShowCropper(false)}
              variant="outline"
              className="border-amber-800/30 text-amber-400 hover:bg-amber-900/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropSave}
              disabled={isUploading}
              className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
            >
              {isUploading ? TEXT_CONTENT.profile.avatar.cropper.saving : TEXT_CONTENT.profile.avatar.cropper.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-red-800/30">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              {TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-300 pt-4">
              {TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.desc}<span className="text-red-500 font-bold">{TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.descHighlight}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-4">
              <p className="text-sm text-zinc-300 mb-2">{TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.warningTitle}</p>
              <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                {TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.warningItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-zinc-300">
                Type <span className="text-red-500 font-mono font-bold">DELETE</span> to confirm:
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="bg-zinc-800 border-red-800/30 text-white placeholder:text-zinc-500"
                disabled={isDeleting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "DELETE"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.deleting : TEXT_CONTENT.profile.settings.danger.deleteAccount.dialog.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main >
  );
} 