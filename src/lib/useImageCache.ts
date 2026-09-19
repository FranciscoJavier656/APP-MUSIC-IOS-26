// ═══════════════════════════════════════════════════════════
// useImageCache.ts — React hook for native image caching
// Uses ImageCachePlugin on iOS, direct URL on web
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const ImageCache: any = Capacitor.isNativePlatform() ? registerPlugin('ImageCache') : null;

// In-memory JS-side cache to avoid repeated bridge calls
const memoryCache = new Map<string, string>();

export function useImageCache(remoteUrl: string | undefined, maxSize: number = 600): string | undefined {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(remoteUrl);

  useEffect(() => {
    if (!remoteUrl) {
      setCachedUrl(undefined);
      return;
    }

    // Web: use remote URL directly (browser handles HTTP caching)
    if (!Capacitor.isNativePlatform() || !ImageCache) {
      setCachedUrl(remoteUrl);
      return;
    }

    // Check JS memory cache first
    const cacheKey = `${remoteUrl}@${maxSize}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      setCachedUrl(cached);
      return;
    }

    // Call native plugin
    let cancelled = false;
    ImageCache.getCachedImageUrl({ url: remoteUrl, maxSize })
      .then((result: { url: string }) => {
        if (!cancelled && result?.url) {
          const localUrl = Capacitor.convertFileSrc(result.url);
          memoryCache.set(cacheKey, localUrl);
          setCachedUrl(localUrl);
        }
      })
      .catch(() => {
        // Fallback to remote on any error
        if (!cancelled) setCachedUrl(remoteUrl);
      });

    return () => { cancelled = true; };
  }, [remoteUrl, maxSize]);

  return cachedUrl;
}

// Utility to clear the JS memory cache (e.g., on low memory warning)
export function clearImageMemoryCache(): void {
  memoryCache.clear();
}
