export async function fetchJSON<T>(url: string): Promise<T> {
  // Use prefetched data if available
  const prefetch = (window as any).__PREFETCH__?.[url];
  if (prefetch) {
    delete (window as any).__PREFETCH__[url];
    return await prefetch as T;
  }
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json() as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json() as T;
}

export class HttpError extends Error {
  status: number;
  responseJSON: unknown;
  constructor(status: number, responseJSON: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new HttpError(res.status, body);
  }
  return await res.json() as T;
}
