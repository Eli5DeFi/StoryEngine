/**
 * Performance utilities for Voidborne
 * Optimizes rendering, caching, and resource loading
 */

// Debounce utility for search/filter inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy load images with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          if (lazyImage.dataset.src) {
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.classList.remove('lazy');
            observer.unobserve(lazyImage);
          }
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );
  observer.observe(img);
}

// Memory cache for API responses (client-side)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Preload critical resources
export function preloadResource(href: string, as: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Measure performance
export function measurePerformance(name: string, fn: () => void): void {
  if (typeof window === 'undefined' || !window.performance) return;
  
  const start = performance.now();
  fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  }
}

// Batch API requests
type BatchRequest = {
  key: string;
  resolver: (data: any) => void;
  rejector: (error: any) => void;
};

const batchQueue: Map<string, BatchRequest[]> = new Map();
const BATCH_DELAY = 50; // ms

export function batchRequest<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const key = `${endpoint}:${JSON.stringify(params)}`;
    
    if (!batchQueue.has(endpoint)) {
      batchQueue.set(endpoint, []);
      
      setTimeout(() => {
        const requests = batchQueue.get(endpoint) || [];
        batchQueue.delete(endpoint);
        
        // Execute all batched requests
        const allParams = requests.map((r) => JSON.parse(r.key.split(':')[1]));
        
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch: allParams }),
        })
          .then((res) => res.json())
          .then((results) => {
            requests.forEach((req, idx) => {
              req.resolver(results[idx]);
            });
          })
          .catch((error) => {
            requests.forEach((req) => req.rejector(error));
          });
      }, BATCH_DELAY);
    }
    
    batchQueue.get(endpoint)?.push({
      key,
      resolver: resolve,
      rejector: reject,
    });
  });
}

// Optimize re-renders with React memo comparison
export function shallowEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

// Virtual scroll helper for large lists
export function getVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan = 3
): { start: number; end: number; items: T[] } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(items.length, start + visibleCount + overscan * 2);
  
  return {
    start,
    end,
    items: items.slice(start, end),
  };
}
