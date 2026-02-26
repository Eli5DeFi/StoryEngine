'use client';

import { Suspense, ComponentType } from 'react';
import { Skeleton } from './skeleton';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wrapper for lazy-loaded components with suspense
 * Provides loading fallback while component loads
 */
export function LazyLoad({ fallback, children }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <Skeleton className="h-96 w-full" />}>
      {children}
    </Suspense>
  );
}

/**
 * HOC to wrap a component with lazy loading
 * Usage: export default withLazyLoad(HeavyComponent)
 */
export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyWrappedComponent(props: P) {
    return (
      <LazyLoad fallback={fallback}>
        <Component {...props} />
      </LazyLoad>
    );
  };
}

/**
 * Lazy load component only when it enters viewport
 * Uses Intersection Observer for performance
 */
export function LazyLoadOnVisible({
  children,
  fallback,
  rootMargin = '50px',
}: LazyLoadProps & { rootMargin?: string }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback || <Skeleton className="h-96 w-full" />}
    </div>
  );
}

// Fix missing React import
import React from 'react';
