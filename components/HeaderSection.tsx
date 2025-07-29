'use client'

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Edit, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  canEdit?: boolean;
  onImageUpload?: (file: File) => void;
  defaultBgColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  shouldRevealImage?: boolean;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  subtitle,
  imageSrc,
  canEdit = false,
  onImageUpload,
  defaultBgColor = "bg-green-900",
  className = "",
  style = {},
  onAnimationStart,
  onAnimationEnd,
  shouldRevealImage = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle animation timing
  useEffect(() => {
    if (imageLoaded && !animationComplete) {
      // Start animation
      onAnimationStart?.();
      
      // Set a timeout to end animation after transition duration + scroll time
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationComplete(true);
        onAnimationEnd?.();
      }, 1500); // 500ms transition + 1000ms scroll duration
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [imageLoaded, animationComplete, onAnimationStart, onAnimationEnd]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    setIsUploading(true);
    await onImageUpload(file);
    setIsUploading(false);
    setShowUploadModal(false);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className={cn(
        "relative w-full h-[400px] md:h-[500px] lg:h-[700px] xl:h-[800px] 2xl:h-[900px] max-w-full overflow-hidden flex items-center justify-center",
        className
      )}
      style={style}
      aria-label="header-section"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title + " header image"}
          fill
          className={cn(
            "object-cover object-center transition-all duration-800 ease-out",
            imageLoaded ? "opacity-100" : "opacity-0",
            shouldRevealImage ? "translate-y-0" : "-translate-y-full"
          )}
          priority
          onLoad={handleImageLoad}
        />
      ) : (
        <div className={cn("absolute inset-0", defaultBgColor)} aria-hidden="true" />
      )}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 transition-all duration-800 ease-out",
          imageLoaded ? "opacity-100" : "opacity-0",
          shouldRevealImage ? "translate-y-0" : "-translate-y-full"
        )}
        aria-hidden="true"
      />
      <div className="relative z-10 p-8 w-full flex flex-col items-center justify-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500 text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-white/90 drop-shadow text-center mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {canEdit && (
        <>
          {isHovering && !showUploadModal && (
            <div className="absolute top-4 right-4 z-20">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-amber-700 hover:bg-amber-600 text-black rounded-full h-12 w-12 flex items-center justify-center"
                size="icon"
                aria-label="Edit banner image"
              >
                <Edit size={20} />
              </Button>
            </div>
          )}
          {showUploadModal && (
            <div className="absolute inset-0 bg-black flex items-center justify-center transition-opacity duration-300 z-10">
              <div className="bg-black p-6 rounded-lg border border-[#F59E0B] backdrop-blur-md max-w-md relative">
                <Button
                  onClick={() => setShowUploadModal(false)}
                  className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-transparent hover:bg-gray-800"
                  size="icon"
                  aria-label="Close upload modal"
                >
                  <X size={16} className="text-gray-400" />
                </Button>
                <h3 className="text-xl text-amber-500 mb-4 font-medieval text-center">Change Banner</h3>
                <Button
                  onClick={triggerFileInput}
                  className="w-full mb-3 bg-amber-700 hover:bg-amber-600 text-black flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  <Upload size={18} />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                <p className="text-gray-400 text-sm text-center">
                  Upload a JPG, PNG or GIF image for your banner
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  aria-label="Upload image file"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 