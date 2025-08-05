import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  width?: number
  height?: number
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  className,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  quality = 75,
  width,
  height,
  fallbackSrc = '/images/placeholders/item-placeholder.svg',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      console.warn(`Image failed to load: ${src}, using fallback`)
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
  }

  const imageProps: ImageProps = {
    src: imageSrc,
    alt,
    className: cn('object-cover', className),
    fill,
    sizes,
    priority,
    quality,
    onError: handleError,
    ...props,
  }

  // Only add width and height if not using fill
  if (!fill) {
    if (width) imageProps.width = width
    if (height) imageProps.height = height
  }

  return <Image {...imageProps} />
} 