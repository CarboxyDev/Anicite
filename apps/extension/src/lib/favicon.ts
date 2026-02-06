/**
 * Favicon utility for fetching and caching site favicons.
 * Uses Google's favicon service as the source.
 */

const FAVICON_CACHE_KEY = 'anicite_favicon_cache';
const FAVICON_SIZE = 32;

// Cache expiry in milliseconds (7 days)
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

type FaviconCache = Record<string, { dataUrl: string; cachedAt: number }>;

/**
 * Get the Google Favicon API URL for a given host.
 */
export function getFaviconUrl(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${FAVICON_SIZE}`;
}

/**
 * Get the cached favicon data for a given host.
 */
async function getCachedFavicon(host: string): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(FAVICON_CACHE_KEY);
    const cache = (result[FAVICON_CACHE_KEY] as FaviconCache) ?? {};
    const entry = cache[host];

    if (!entry) return null;

    // Check if cache is expired
    if (Date.now() - entry.cachedAt > CACHE_EXPIRY_MS) {
      // Remove expired entry
      delete cache[host];
      await chrome.storage.local.set({ [FAVICON_CACHE_KEY]: cache });
      return null;
    }

    return entry.dataUrl;
  } catch {
    return null;
  }
}

/**
 * Cache a favicon data URL for a given host.
 */
async function cacheFavicon(host: string, dataUrl: string): Promise<void> {
  try {
    const result = await chrome.storage.local.get(FAVICON_CACHE_KEY);
    const cache = (result[FAVICON_CACHE_KEY] as FaviconCache) ?? {};

    cache[host] = {
      dataUrl,
      cachedAt: Date.now(),
    };

    await chrome.storage.local.set({ [FAVICON_CACHE_KEY]: cache });
  } catch {
    // Silently fail caching - not critical
  }
}

/**
 * Fetch a favicon and convert it to a base64 data URL.
 */
async function fetchFaviconAsDataUrl(host: string): Promise<string | null> {
  try {
    const url = getFaviconUrl(host);
    const response = await fetch(url);

    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Get a favicon for a host, using cache when available.
 * Returns a data URL or null if unavailable.
 */
export async function getFavicon(host: string): Promise<string | null> {
  // Try cache first
  const cached = await getCachedFavicon(host);
  if (cached) return cached;

  // Fetch and cache
  const dataUrl = await fetchFaviconAsDataUrl(host);
  if (dataUrl) {
    await cacheFavicon(host, dataUrl);
  }

  return dataUrl;
}

/**
 * Prefetch favicons for multiple hosts.
 * Useful for batch loading when displaying lists.
 */
export async function prefetchFavicons(hosts: string[]): Promise<void> {
  const uniqueHosts = [...new Set(hosts)];
  await Promise.allSettled(uniqueHosts.map((host) => getFavicon(host)));
}

/**
 * Clear all cached favicons.
 */
export async function clearFaviconCache(): Promise<void> {
  await chrome.storage.local.remove(FAVICON_CACHE_KEY);
}
