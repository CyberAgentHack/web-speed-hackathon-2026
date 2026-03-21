interface APIError extends Error {
  responseJSON?: unknown;
  status: number;
}

interface PrefetchedJSONEntry {
  data: unknown;
  expiresAt: number;
}

const PREFETCH_CACHE_TTL_MS = 20_000;
const prefetchedJSONCache = new Map<string, PrefetchedJSONEntry>();

function getPrefetchedJSONEntry(url: string): PrefetchedJSONEntry | undefined {
  const entry = prefetchedJSONCache.get(url);
  if (entry === undefined) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    prefetchedJSONCache.delete(url);
    return undefined;
  }
  return entry;
}

async function fetchOrThrow(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`${response.status} ${response.statusText}`) as APIError;
    error.status = response.status;
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        error.responseJSON = await response.json();
      } catch {
        // keep fallback error message when response is not valid JSON
      }
    }
    throw error;
  }
  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetchOrThrow(url);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetchOrThrow(url);
  return response.json() as Promise<T>;
}

export function primePrefetchedJSON<T>(url: string, data: T): void {
  prefetchedJSONCache.set(url, {
    data,
    expiresAt: Date.now() + PREFETCH_CACHE_TTL_MS,
  });
}

export function consumePrefetchedJSON<T>(url: string): T | undefined {
  const entry = getPrefetchedJSONEntry(url);
  if (entry === undefined) {
    return undefined;
  }

  prefetchedJSONCache.delete(url);
  return entry.data as T;
}

export async function prefetchJSON<T>(url: string): Promise<void> {
  const cachedEntry = getPrefetchedJSONEntry(url);
  if (cachedEntry !== undefined) {
    return;
  }

  try {
    const data = await fetchJSON<T>(url);
    primePrefetchedJSON(url, data);
  } catch {
    // Prefetch should not block the user path when it fails.
  }
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetchOrThrow(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetchOrThrow(url, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return response.json() as Promise<T>;
}
