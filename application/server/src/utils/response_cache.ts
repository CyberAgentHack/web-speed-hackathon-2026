const MAX_RESPONSE_CACHE_SIZE = 64;

const responseCache = new Map<string, string>();
let homeFirstMovieIdCache: string | null | undefined;

function setCachedResponse(key: string, value: string) {
  if (responseCache.has(key)) {
    responseCache.delete(key);
  }

  responseCache.set(key, value);

  if (responseCache.size > MAX_RESPONSE_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey != null) {
      responseCache.delete(oldestKey);
    }
  }
}

export async function getCachedJSONResponse(
  key: string,
  factory: () => Promise<unknown>,
): Promise<string> {
  const cached = responseCache.get(key);
  if (cached != null) {
    return cached;
  }

  const nextValue = JSON.stringify(await factory());
  setCachedResponse(key, nextValue);
  return nextValue;
}

export function getCachedHomeFirstMovieId(): string | null | undefined {
  return homeFirstMovieIdCache;
}

export function setCachedHomeFirstMovieId(movieId: string | null) {
  homeFirstMovieIdCache = movieId;
}

export function clearResponseCaches() {
  responseCache.clear();
  homeFirstMovieIdCache = undefined;
}
