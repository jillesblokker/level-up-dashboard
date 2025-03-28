"use client";

import { db } from "@/lib/db";
import { toast } from "@/components/ui/use-toast";

// Maximum image size in bytes (2MB)
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

// Upload an image file and save it to IndexedDB
export async function uploadImage(file: File, imageId: string): Promise<string | null> {
  try {
    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
        variant: "destructive",
      });
      return null;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return null;
    }

    // Read file as data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || typeof event.target.result !== "string") {
          reject(new Error("Failed to read file"));
          return;
        }

        try {
          let dataUrl = event.target.result;
          
          // Compress image if it's too large
          if (dataUrl.length > MAX_IMAGE_SIZE) {
            dataUrl = await compressImage(file);
          }
          
          // Save image to database
          await db.images.put({
            id: imageId,
            dataUrl,
            dateModified: new Date().toISOString()
          });
          
          resolve(dataUrl);
        } catch (error) {
          console.error("Error processing image:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    toast({
      title: "Upload Error",
      description: "Failed to upload image. Please try again.",
      variant: "destructive",
    });
    return null;
  }
}

// Get an image from IndexedDB by its ID
export async function getImage(imageId: string): Promise<string | null> {
  try {
    const image = await db.images.get(imageId);
    return image?.dataUrl || null;
  } catch (error) {
    console.error("Error retrieving image:", error);
    return null;
  }
}

// Compress image by scaling and reducing quality
export const compressImage = (file: File, maxWidth = 1200, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        // Create a canvas to resize the image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Set canvas dimensions and draw resized image
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        // Convert to compressed JPEG format
        try {
          const compressedImage = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedImage)
        } catch (err) {
          reject(new Error('Failed to compress image'))
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
  })
} 