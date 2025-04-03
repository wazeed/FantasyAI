// import { logError } from './loggingService'; // Assuming loggingService exports logError after its refactor

/**
 * Interface for items stored in the cache.
 */
interface CacheItem<T> {
  data: T;
  expiresAt: number; // Timestamp in milliseconds
}

// Module-level cache instance
const cache = new Map<string, CacheItem<any>>();

// Default Time-To-Live for cache items in milliseconds (default: 5 minutes)
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Calculates the expiration timestamp.
 * @param ttlMinutes Optional TTL in minutes. Uses default if not provided.
 * @returns Expiration timestamp in milliseconds.
 */
function calculateExpiresAt(ttlMinutes?: number): number {
  const ttlMs = ttlMinutes ? ttlMinutes * 60 * 1000 : DEFAULT_TTL_MS;
  return Date.now() + ttlMs;
}

/**
 * Checks if a cache item is expired and deletes it if it is.
 * @param key The cache key.
 * @param item The cache item.
 * @returns True if the item is valid (exists and not expired), false otherwise.
 */
function isItemValid<T>(key: string, item: CacheItem<T> | undefined): item is CacheItem<T> {
  if (!item) {
    return false;
  }
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return false;
  }
  return true;
}

/**
 * Sets a value in the cache with an optional Time-To-Live (TTL).
 * @param key The key to store the value under.
 * @param value The value to store.
 * @param ttlMinutes Optional TTL in minutes. Uses default if not provided.
 */
export function setCacheItem<T>(key: string, value: T, ttlMinutes?: number): void {
  const expiresAt = calculateExpiresAt(ttlMinutes);
  cache.set(key, { data: value, expiresAt });
}

/**
 * Retrieves a value from the cache. Returns null if the key doesn't exist or the item is expired.
 * @param key The key of the item to retrieve.
 * @returns The cached value or null.
 */
export function getCacheItem<T>(key: string): T | null {
  const item = cache.get(key);
  if (!isItemValid(key, item)) {
    return null;
  }
  return item.data as T;
}

/**
 * Retrieves a value from the cache. If the value is not found or expired,
 * it computes the value using the provided async function, stores it in the cache,
 * and then returns it.
 * @param key The key of the item to retrieve or compute.
 * @param computeFn An async function that computes the value if not found in cache.
 * @param ttlMinutes Optional TTL in minutes for the newly computed item.
 * @returns The cached or computed value, or null if computation fails.
 */
export async function getOrComputeCacheItem<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttlMinutes?: number
): Promise<T | null> {
  const cachedValue = getCacheItem<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  try {
    const computedValue = await computeFn();
    // Avoid caching null/undefined values explicitly, let computeFn decide
    if (computedValue !== null && computedValue !== undefined) {
      setCacheItem(key, computedValue, ttlMinutes);
    }
    return computedValue;
  } catch (error) {
    // Use the logging service (assuming it's refactored)
    // logError('Error computing value for cache', { error, key });
    console.error('Error computing value for cache:', { error, key }); // Kept for fallback if loggingService is not ready
    return null;
  }
}

/**
 * Deletes a specific item from the cache.
 * @param key The key of the item to delete.
 */
export function deleteCacheItem(key: string): void {
  cache.delete(key);
}

/**
 * Clears all expired items from the cache.
 * Iterates through the cache and removes items whose expiration time has passed.
 */
export function clearExpiredCacheItems(): void {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}

/**
 * Clears the entire cache, removing all items regardless of their expiration status.
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Retrieves multiple items from the cache based on an array of keys.
 * @param keys An array of keys to retrieve.
 * @returns A Map where keys are the requested cache keys and values are the found items.
 *          Items that are not found or expired are omitted.
 */
export function getManyCacheItems<T>(keys: string[]): Map<string, T> {
  const result = new Map<string, T>();
  keys.forEach(key => {
    const value = getCacheItem<T>(key);
    if (value !== null) {
      result.set(key, value);
    }
  });
  return result;
}

/**
 * Sets multiple items in the cache.
 * @param items A Map where keys are the cache keys and values are the items to store.
 * @param ttlMinutes Optional TTL in minutes, applied to all items being set.
 */
export function setManyCacheItems<T>(items: Map<string, T>, ttlMinutes?: number): void {
  items.forEach((value, key) => {
    setCacheItem(key, value, ttlMinutes);
  });
}

/**
 * Checks if a key exists in the cache and the corresponding item is not expired.
 * @param key The key to check.
 * @returns True if the key exists and the item is valid, false otherwise.
 */
export function hasCacheItem(key: string): boolean {
  const item = cache.get(key);
  return isItemValid(key, item);
}

/**
 * Gets statistics about the cache.
 * @returns An object containing the total number of items and the count of expired items.
 */
export function getCacheStats(): { size: number; expiredCount: number } {
  let expiredCount = 0;
  const now = Date.now();

  cache.forEach(item => {
    if (now > item.expiresAt) {
      expiredCount++;
    }
  });

  return {
    size: cache.size,
    expiredCount,
  };
}

// Store the interval ID for potential cleanup later
let cleanupIntervalId: NodeJS.Timer | null = null;

/**
 * Starts an interval timer to automatically clear expired cache items periodically.
 * @param intervalMinutes The interval in minutes between cleanup runs. Defaults to 30 minutes.
 * @returns The NodeJS.Timer object for the interval.
 */
export function startCacheCleanupInterval(intervalMinutes: number = 30): NodeJS.Timer {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId as any); // Clear existing interval if any (cast to any for type compatibility)
  }
  const intervalMs = intervalMinutes * 60 * 1000;
  cleanupIntervalId = setInterval(() => {
    clearExpiredCacheItems();
  }, intervalMs);
  return cleanupIntervalId;
}

/**
 * Stops the automatic cache cleanup interval.
 */
export function stopCacheCleanupInterval(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId as any); // Cast to any for type compatibility
    cleanupIntervalId = null;
  }
}