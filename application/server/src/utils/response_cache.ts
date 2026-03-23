const cache = new Map<string, { data: unknown; expiry: number }>();
const MAX_ENTRIES = 64;
const DEFAULT_TTL_MS = 10_000;

export function getCached(key: string): unknown | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

export function setCache(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
