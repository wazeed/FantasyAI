interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private readonly defaultTTL: number;

  private constructor(defaultTTLMinutes: number = 5) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLMinutes * 60 * 1000; // Convert to milliseconds
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set a value in the cache with optional TTL
   */
  public set<T>(key: string, value: T, ttlMinutes?: number): void {
    const expiresAt = Date.now() + (ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL);
    this.cache.set(key, {
      data: value,
      expiresAt
    });
  }

  /**
   * Get a value from the cache
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Get a value from cache or compute it if not present
   */
  public async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlMinutes?: number
  ): Promise<T | null> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    try {
      const computedValue = await compute();
      if (computedValue !== null) {
        this.set(key, computedValue, ttlMinutes);
      }
      return computedValue;
    } catch (error) {
      console.error('Error computing value for cache:', error);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all expired items from the cache
   */
  public clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get multiple values from cache
   */
  public getMany<T>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    });
    return result;
  }

  /**
   * Set multiple values in cache
   */
  public setMany<T>(items: Map<string, T>, ttlMinutes?: number): void {
    items.forEach((value, key) => {
      this.set(key, value, ttlMinutes);
    });
  }

  /**
   * Check if a key exists and is not expired
   */
  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get cache stats
   */
  public getStats(): {
    size: number;
    expired: number;
  } {
    let expired = 0;
    const now = Date.now();
    
    this.cache.forEach(item => {
      if (now > item.expiresAt) {
        expired++;
      }
    });

    return {
      size: this.cache.size,
      expired
    };
  }

  /**
   * Start automatic cache cleanup
   */
  public startCleanupInterval(intervalMinutes: number = 30): NodeJS.Timer {
    return setInterval(() => {
      this.clearExpired();
    }, intervalMinutes * 60 * 1000);
  }
}