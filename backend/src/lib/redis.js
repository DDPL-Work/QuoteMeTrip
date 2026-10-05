/**
 * Selective Caching Layer (Redis-compatible Interface + Graceful Fallback).
 *
 * Database (MySQL) remains the single authoritative source of truth.
 * Provides namespaced caching with automatic TTL, key invalidation,
 * and zero-crash fallback to MySQL if cache is unavailable.
 */

class MemoryCacheStore {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  del(key) {
    if (typeof key === 'string') {
      this.store.delete(key);
    } else if (Array.isArray(key)) {
      for (const k of key) this.store.delete(k);
    }
  }

  delPattern(pattern) {
    const regexStr = '^' + pattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  flush() {
    this.store.clear();
  }
}

const memoryStore = new MemoryCacheStore();

export const cache = {
  async get(key) {
    try {
      return memoryStore.get(key);
    } catch {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 60) {
    try {
      memoryStore.set(key, value, ttlSeconds);
    } catch {
      // ignore
    }
  },

  async del(key) {
    try {
      memoryStore.del(key);
    } catch {
      // ignore
    }
  },

  async delPattern(pattern) {
    try {
      memoryStore.delPattern(pattern);
    } catch {
      // ignore
    }
  },

  /**
   * Transparent cache wrapper: gets cached value or calls fetcherFn and sets cache.
   */
  async remember(key, ttlSeconds, fetcherFn) {
    try {
      const cached = await this.get(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch {
      // fallback straight to fetcherFn on cache read error
    }

    const freshData = await fetcherFn();

    try {
      if (freshData !== null && freshData !== undefined) {
        await this.set(key, freshData, ttlSeconds);
      }
    } catch {
      // ignore write errors
    }

    return freshData;
  },
};

export default cache;
