import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  medieval?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width = 200,
  height = 200,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  medieval = false,
  fallback = '/images/placeholder.png',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const imageSrc = imageError ? fallback : src;

  if (medieval) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg', className)}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-amber-800/10 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-amber-300 text-xs">Loading...</p>
            </div>
          </div>
        )}

        {/* Image */}
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          {...(blurDataURL && { blurDataURL })}
          className={cn(
            'transition-all duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            'object-cover rounded-lg shadow-lg border border-amber-600/20'
          )}
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Medieval border effect */}
        <div className="absolute inset-0 rounded-lg border-2 border-amber-500/20 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        {...(blurDataURL && { blurDataURL })}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Quest image component
interface QuestImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QuestImage({
  src,
  alt,
  className,
  size = 'md',
}: QuestImageProps) {
  const sizeConfig = {
    sm: { width: 60, height: 60 },
    md: { width: 80, height: 80 },
    lg: { width: 120, height: 120 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizeConfig[size].width}
      height={sizeConfig[size].height}
      {...(className && { className })}
      medieval={true}
      quality={80}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
}

// Kingdom tile image component
interface KingdomTileImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export function KingdomTileImage({
  src,
  alt,
  className,
  size = 'md',
  rarity = 'common',
}: KingdomTileImageProps) {
  const sizeConfig = {
    sm: { width: 80, height: 80 },
    md: { width: 100, height: 100 },
    lg: { width: 150, height: 150 },
  };

  const getRarityBorder = () => {
    switch (rarity) {
      case 'common':
        return 'border-gray-500/30';
      case 'uncommon':
        return 'border-green-500/30';
      case 'rare':
        return 'border-blue-500/30';
      case 'epic':
        return 'border-purple-500/30';
      case 'legendary':
        return 'border-yellow-500/30';
      default:
        return 'border-gray-500/30';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={sizeConfig[size].width}
        height={sizeConfig[size].height}
        medieval={true}
        quality={85}
        placeholder="blur"
        className={cn('border-2', getRarityBorder())}
      />
      
      {/* Rarity glow effect */}
      {rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-lg border-2 border-yellow-400/50 animate-pulse" />
      )}
    </div>
  );
}

// Avatar image component
interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarImage({
  src,
  alt,
  className,
  size = 'md',
}: AvatarImageProps) {
  const sizeConfig = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizeConfig[size].width}
      height={sizeConfig[size].height}
      className={cn('rounded-full border-2 border-amber-500/30', className)}
      medieval={true}
      quality={90}
      placeholder="blur"
    />
  );
}
