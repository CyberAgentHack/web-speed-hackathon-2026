type PrefetchCache = Record<string, Promise<unknown>>;

function getPrefetchCache(): PrefetchCache {
  const globalWindow = window as unknown as { __q?: PrefetchCache };
  globalWindow.__q ??= {};
  return globalWindow.__q;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function prefetchJSON<T>(url: string): Promise<T | null> {
  const cache = getPrefetchCache();
  const cached = cache[url] as Promise<T | null> | undefined;
  if (cached) {
    return cached;
  }

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.json() as Promise<T>;
    })
    .catch(() => null);

  cache[url] = promise;
  return promise;
}

export function primePrefetchJSON<T>(url: string, data: T): void {
  const cache = getPrefetchCache();
  cache[url] = Promise.resolve(data);
}

export function consumePrefetchJSON<T>(url: string): Promise<T | null> | undefined {
  const cache = getPrefetchCache();
  const cached = cache[url] as Promise<T | null> | undefined;
  if (cached !== undefined) {
    delete cache[url];
  }
  return cached;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
