"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { eventBus } from "@/app/lib/event-bus";
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getCroppedImg } from '../../app/lib/cropImage';
import type { Area } from 'react-easy-crop';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Shield, Sword, User, Palette, Camera, Save } from "lucide-react";
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
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6" aria-label="profile-loading-card">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            <p className="text-center">Loading your profile...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-16 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl h-80 flex flex-col items-center justify-center text-center rounded-lg overflow-hidden mb-8">
          {/* Hero background with medieval theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900 to-black/80" />
          <div className="absolute inset-0 bg-[url('/images/kingdom-header.jpg')] bg-cover bg-center opacity-20" />
          
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          <div className="absolute top-4 right-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-amber-500/30 rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-8">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-amber-500/30">
              <User className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-amber-400 mb-4 drop-shadow-lg">Join the Kingdom</h2>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">Access your realm, customize your avatar, and track your progress by signing in.</p>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold rounded-lg px-8 py-3 text-lg hover:from-amber-600 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-amber-500/25" 
              aria-label="Sign in to profile" 
              onClick={() => window.location.href = '/auth/signin'}
            >
              <Crown className="w-5 h-5 mr-2" />
              Sign In to Your Realm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container max-w-4xl py-8" aria-label="profile-settings-section">
      {/* Hero Section */}
      <div className="relative mb-8 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900 to-black/80" />
        <div className="absolute inset-0 bg-[url('/images/kingdom-header.jpg')] bg-cover bg-center opacity-30" />
        
        {/* Decorative border elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-amber-500 to-transparent" />
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-amber-500 to-transparent" />
        
        <div className="relative z-10 p-8 flex items-center space-x-6">
          {/* Large Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-amber-500/30 overflow-hidden bg-gray-900 shadow-lg">
              {avatarType === 'uploaded' && user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : avatarType === 'default' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <img src={placeholderSvg} alt="Default avatar" className="w-12 h-12 object-contain opacity-70" />
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
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-gray-900">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {displayName || user?.username || 'Adventurer'}
            </h1>
            <p className="text-amber-400 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Realm Explorer
            </p>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Sword className="w-3 h-3 mr-1" />
                Active
              </Badge>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="avatar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-amber-800/20">
          <TabsTrigger value="avatar" className="data-[state=active]:bg-amber-900 data-[state=active]:text-amber-400">
            <Camera className="w-4 h-4 mr-2" />
            Avatar
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-amber-900 data-[state=active]:text-amber-400">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-amber-900 data-[state=active]:text-amber-400">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatar" className="space-y-6">
          <Card className="bg-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="text-xl text-amber-400 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Avatar Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-3 block">Choose Avatar Type</Label>
                <div className="flex gap-4">
                  {/* Initial Avatar */}
                  <button
                    type="button"
                    className={`relative group transition-all duration-200 ${
                      avatarType === 'initial' 
                        ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' 
                        : 'hover:ring-2 hover:ring-amber-500/50 ring-offset-2 ring-offset-gray-900'
                    }`}
                    onClick={() => setAvatarType('initial')}
                    aria-label="Use initial avatar"
                  >
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-amber-800/30 transition-all duration-200 group-hover:border-amber-500/50"
                      style={{ backgroundColor: avatarBgColor }}
                    >
                      <span style={{ color: avatarTextColor, fontSize: 28, fontWeight: 700 }}>
                        {displayName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                      Initial
                    </div>
                  </button>

                  {/* Default Avatar */}
                  <button
                    type="button"
                    className={`relative group transition-all duration-200 ${
                      avatarType === 'default' 
                        ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' 
                        : 'hover:ring-2 hover:ring-amber-500/50 ring-offset-2 ring-offset-gray-900'
                    }`}
                    onClick={() => setAvatarType('default')}
                    aria-label="Use default avatar"
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-amber-800/30 transition-all duration-200 group-hover:border-amber-500/50 bg-gray-800">
                      <img src={placeholderSvg} alt="Default avatar" className="w-10 h-10 object-contain opacity-70" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                      Default
                    </div>
                  </button>

                  {/* Uploaded Avatar */}
                  <button
                    type="button"
                    className={`relative group transition-all duration-200 ${
                      avatarType === 'uploaded' 
                        ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' 
                        : 'hover:ring-2 hover:ring-amber-500/50 ring-offset-2 ring-offset-gray-900'
                    } ${!user?.imageUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => user?.imageUrl && setAvatarType('uploaded')}
                    aria-label="Use uploaded avatar"
                    disabled={!user?.imageUrl}
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-amber-800/30 transition-all duration-200 group-hover:border-amber-500/50 bg-gray-900 overflow-hidden">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Uploaded avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-sm">No image</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                      Custom
                    </div>
                  </button>
                </div>
              </div>

              {/* Upload Section for Custom Avatar */}
              {avatarType === 'uploaded' && (
                <div className="space-y-3">
                  <Label htmlFor="avatar" className="text-sm font-medium text-gray-300">Upload New Image</Label>
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
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">
                    Recommended: Square image, max 5MB. Your image will be cropped to fit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="text-xl text-amber-400 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">Display Name</Label>
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
                <Label className="text-sm font-medium text-gray-300">Email Address</Label>
                <div className="bg-gray-800/50 text-white rounded-md px-3 py-2 border border-amber-800/20 max-w-md">
                  {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''}
                </div>
                <p className="text-sm text-gray-400">Email address is managed by your authentication provider.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="text-xl text-amber-400 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Avatar Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {avatarType === 'initial' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="avatarBgColor" className="text-sm font-medium text-gray-300">Background Color</Label>
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
                    <Label htmlFor="avatarTextColor" className="text-sm font-medium text-gray-300">Text Color</Label>
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
                    <Label className="text-sm font-medium text-gray-300">Preview</Label>
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-amber-500/30"
                        style={{ backgroundColor: avatarBgColor }}
                      >
                        <span style={{ color: avatarTextColor, fontSize: 24, fontWeight: 700 }}>
                          {displayName?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        This is how your avatar will appear in the realm.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Palette className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Appearance customization is only available for initial avatars.</p>
                  <p className="text-sm text-gray-500 mt-2">Switch to &quot;Initial&quot; avatar type to customize colors.</p>
                </div>
              )}
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
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>

      {/* Avatar Cropper Modal */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent role="dialog" aria-label="profile-modal" className="sm:max-w-4xl">
          <DialogDescription id="profile-modal-desc">Crop your profile image to the perfect size</DialogDescription>
          <DialogTitle className="text-xl text-amber-400 mb-4">Crop Avatar</DialogTitle>
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
              {isUploading ? "Saving..." : "Save Avatar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
} 