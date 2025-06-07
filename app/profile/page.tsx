"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updateUserMetadata, UserMetadata } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.username || user?.emailAddresses[0]?.emailAddress || "");
  const [avatarBgColor, setAvatarBgColor] = useState(user?.publicMetadata?.['avatar_bg_color'] as string || "#1f2937");
  const [avatarTextColor, setAvatarTextColor] = useState(user?.publicMetadata?.['avatar_text_color'] as string || "#ffffff");
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    try {
      setIsUploading(true);
      // The avatar upload logic will need to be adjusted to use Supabase storage.
      // For now, I will comment out the old fetch call and the session update.
      // const formData = new FormData();
      // formData.append("file", file);

      // const response = await fetch("/api/upload/avatar", {
      //   method: "POST",
      //   body: formData,
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to upload avatar");
      // }

      // const data = await response.json();
      
      // Update the session with the new avatar URL
      // await update({
      //   ...session,
      //   user: {
      //     ...session?.user,
      //     image: data.url,
      //   },
      // });

      toast.info("Avatar upload is not yet implemented for Supabase.");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const metadata: UserMetadata = {
        user_name: displayName,
        avatar_bg_color: avatarBgColor,
        avatar_text_color: avatarTextColor,
      };
      await updateUserMetadata(user.id, metadata);
      
      // Force a page reload to ensure all components get the updated metadata
      window.location.reload();
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="p-6" aria-label="profile-loading-card">
          <p className="text-center">Loading profile...</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-16 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-md h-64 flex flex-col items-center justify-center text-center rounded-lg overflow-hidden mb-8">
          {/* Placeholder image */}
          <Image
            src="/images/placeholders/item-placeholder.svg"
            alt="Profile placeholder"
            fill
            className="object-cover opacity-70 pointer-events-none"
            aria-hidden="true"
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
            <h2 className="text-2xl font-bold text-amber-500 mb-2 drop-shadow">Sign in to view your profile</h2>
            <p className="text-gray-300 mb-4">Access your stats, avatar, and progress by signing in.</p>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold rounded px-6 py-2 mt-2" aria-label="Sign in to profile" onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container max-w-2xl py-8" aria-label="profile-settings-section">
      <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
      
      <Card className="p-6" aria-label="profile-settings-card">
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Avatar 
              className="w-24 h-24" 
              style={{ backgroundColor: avatarBgColor }}
              aria-label="profile-avatar"
            >
              <AvatarImage 
                src={user.imageUrl || ""} 
                alt={displayName || user.emailAddresses[0]?.emailAddress || ""} 
              />
              <AvatarFallback 
                style={{ color: avatarTextColor }}
              >
                {displayName?.[0]?.toUpperCase() || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium">
                Profile Picture
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="w-full"
                aria-label="profile-picture-upload"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: Square image, max 5MB
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="max-w-md"
              aria-label="display-name-input"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatarBgColor">Avatar Background Color</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  id="avatarBgColor"
                  type="color"
                  value={avatarBgColor}
                  onChange={(e) => setAvatarBgColor(e.target.value)}
                  className="w-20 h-10 p-1"
                  aria-label="avatar-background-color"
                />
                <Input
                  type="text"
                  value={avatarBgColor}
                  onChange={(e) => setAvatarBgColor(e.target.value)}
                  className="flex-1"
                  aria-label="avatar-background-color-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarTextColor">Avatar Text Color</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  id="avatarTextColor"
                  type="color"
                  value={avatarTextColor}
                  onChange={(e) => setAvatarTextColor(e.target.value)}
                  className="w-20 h-10 p-1"
                  aria-label="avatar-text-color"
                />
                <Input
                  type="text"
                  value={avatarTextColor}
                  onChange={(e) => setAvatarTextColor(e.target.value)}
                  className="flex-1"
                  aria-label="avatar-text-color-text"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full"
            aria-label="Save profile changes"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </main>
  );
} 