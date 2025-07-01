"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { eventBus } from "@/app/lib/event-bus";
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getCroppedImg } from '../../app/lib/cropImage';
import type { Area } from 'react-easy-crop';
const placeholderSvg = "/images/placeholders/item-placeholder.svg";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
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

  useEffect(() => {
    // Log user and isLoaded for debugging
    // eslint-disable-next-line no-console
    console.log("[ProfilePage] Clerk user:", user, "isLoaded:", isLoaded);
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
          <img
            src="/images/placeholders/item-placeholder.svg"
            alt="Profile placeholder"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, pointerEvents: 'none', position: 'absolute', inset: 0 }}
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
            <p className="text-red-400 mt-4">Error: Clerk user not found. Please ensure you are signed in and Clerk is initialized.</p>
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
          {/* Avatar Selection Tabs */}
          <div className="flex gap-4 mb-4">
            {/* Option 1: Initial with color */}
            <button
              type="button"
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${avatarType === 'initial' ? 'border-amber-500' : 'border-gray-700'} transition`}
              style={{ backgroundColor: avatarBgColor }}
              onClick={() => setAvatarType('initial')}
              aria-label="Use initial avatar"
            >
              <span style={{ color: avatarTextColor, fontSize: 32, fontWeight: 700 }}>
                {displayName?.[0]?.toUpperCase() || '?'}
              </span>
            </button>
            {/* Option 2: Default image */}
            <button
              type="button"
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${avatarType === 'default' ? 'border-amber-500' : 'border-gray-700'} transition bg-gray-800`}
              onClick={() => setAvatarType('default')}
              aria-label="Use default avatar"
            >
              <img src={placeholderSvg} alt="Default avatar" className="w-10 h-10 object-contain" />
            </button>
            {/* Option 3: Uploaded image */}
            <button
              type="button"
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${avatarType === 'uploaded' ? 'border-amber-500' : 'border-gray-700'} transition bg-gray-900`}
              onClick={() => setAvatarType('uploaded')}
              aria-label="Use uploaded avatar"
              disabled={!user?.imageUrl}
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Uploaded avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-gray-500">No image</span>
              )}
            </button>
          </div>

          {/* Show customization options below */}
          {avatarType === 'initial' && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="avatarBgColor">Avatar Background Color</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  id="avatarBgColor"
                  name="avatarBgColor"
                  type="color"
                  value={avatarBgColor}
                  onChange={(e) => setAvatarBgColor(e.target.value)}
                  className="w-20 h-10 p-1"
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
                />
              </div>
              <Label htmlFor="avatarTextColor">Avatar Text Color</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  id="avatarTextColor"
                  name="avatarTextColor"
                  type="color"
                  value={avatarTextColor}
                  onChange={(e) => setAvatarTextColor(e.target.value)}
                  className="w-20 h-10 p-1"
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
                />
              </div>
            </div>
          )}
          {avatarType === 'uploaded' && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="avatar" className="text-sm font-medium">Profile Picture</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="w-full"
                aria-label="profile-picture-upload"
                autoComplete="photo"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: Square image, max 5MB
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="max-w-md"
              aria-label="display-name-input"
              autoComplete="name"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <div id="email" className="bg-gray-900 text-white rounded px-3 py-2">{user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''}</div>
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

      {/* Avatar Cropper Modal */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent role="dialog" aria-label="profile-modal">
          <DialogTitle className="sr-only">Crop Avatar</DialogTitle>
          {selectedImage && (
            <div style={{ position: 'relative', width: '100%', height: 300 }}>
              <Cropper
                image={URL.createObjectURL(selectedImage)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setShowCropper(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleCropSave} disabled={isUploading}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
} 