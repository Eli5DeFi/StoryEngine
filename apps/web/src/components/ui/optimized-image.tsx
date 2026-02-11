import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  /**
   * Base64 blur placeholder for instant loading feedback
   * Generate with: https://blurha.sh/
   */
  blurDataURL?: string
}

/**
 * Optimized Image component with blur-up effect and lazy loading
 * 
 * Features:
 * - Automatic blur placeholder
 * - Progressive loading
 * - Lazy loading (default)
 * - WebP/AVIF support
 * - Responsive sizes
 * 
 * @example
 * <OptimizedImage
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   blurDataURL="data:image/png;base64,..."
 * />
 */
export function OptimizedImage({
  className,
  alt,
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={cn('overflow-hidden', className)}>
      <Image
        {...props}
        alt={alt}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        loading={props.priority ? undefined : 'lazy'}
        quality={props.quality || 85}
        onLoad={() => setIsLoading(false)}
        className={cn(
          'transition-all duration-300',
          isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'
        )}
      />
    </div>
  )
}

/**
 * Generate a small blur placeholder from any image URL
 * Uses Next.js built-in image optimization
 * 
 * Usage in getStaticProps/getServerSideProps:
 * 
 * const blurDataURL = await getBlurDataURL('/path/to/image.jpg')
 */
export async function getBlurDataURL(src: string): Promise<string> {
  // In production, use sharp or plaiceholder for blur generation
  // For now, return a simple gray placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjEyMTIxIi8+PC9zdmc+'
}
