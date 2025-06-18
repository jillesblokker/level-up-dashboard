"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/image-utils";
import Image from 'next/image';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  imageId: string;
  className?: string;
  aspectRatio?: string;
  initialImage?: string;
}

export function ImageUpload({ 
  onImageUploaded, 
  imageId, 
  className = "", 
  aspectRatio = "aspect-square",
  initialImage = ""
}: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialImage);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    try {
      setIsUploading(true);
      
      // Create a preview
      const localPreview = file ? URL.createObjectURL(file) : '';
      setPreviewUrl(localPreview);
      
      // Upload the image
      if (file instanceof File) {
        const uploadedUrl = await uploadImage(file, imageId);
        
        if (uploadedUrl) {
          onImageUploaded(uploadedUrl);
          toast({
            title: "Image Uploaded",
            description: "Your image has been successfully uploaded.",
            variant: "default",
          });
        } else {
          setPreviewUrl(initialImage); // Revert to previous image
          toast({
            title: "Upload Failed",
            description: "There was a problem uploading your image.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setPreviewUrl(initialImage); // Revert to previous image
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearImage = () => {
    setPreviewUrl("");
    onImageUploaded("");
    toast({
      title: "Image Removed",
      description: "The image has been removed.",
      variant: "default",
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`${className} w-full relative`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
        aria-label="Upload image"
      />
      
      <div className={`${aspectRatio} w-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700`}>
        {previewUrl ? (
          <div className="relative h-full">
            <Image
              src={typeof previewUrl === 'string' ? previewUrl : ''}
              alt="Preview"
              title="Preview image"
              className="w-full h-full object-cover"
              width={400}
              height={300}
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 rounded-full p-1 h-8 w-8"
              onClick={handleClearImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex flex-col items-center justify-center h-full w-full space-y-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm">Upload Image</span>
          </button>
        )}
      </div>
      
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
          <div className="text-white">Uploading...</div>
        </div>
      )}
    </div>
  );
} 