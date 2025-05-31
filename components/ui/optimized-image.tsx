import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

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
  ...props
}: OptimizedImageProps) {
  const imageProps: ImageProps = {
    src,
    alt,
    className: cn('object-cover', className),
    fill,
    sizes,
    priority,
    quality,
    ...props,
  }

  // Only add width and height if not using fill
  if (!fill) {
    if (width) imageProps.width = width
    if (height) imageProps.height = height
  }

  return <Image {...imageProps} />
} 