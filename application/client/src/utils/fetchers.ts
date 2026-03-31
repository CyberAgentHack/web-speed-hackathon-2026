export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchBinary failed: ${res.status}`);
  }
  return res.arrayBuffer();
}

declare global {
  interface Window {
    __PREFETCH__?: Record<string, Promise<unknown>>;
  }
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const prefetched = window.__PREFETCH__?.[url];
  if (prefetched) {
    delete window.__PREFETCH__![url];
    return prefetched as Promise<T>;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchJSON failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
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
    throw new Error(`sendFile failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
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
    let code: string | undefined;
    try {
      const body = await res.json();
      code = body.code;
    } catch {}
    throw new ApiError(`sendJSON failed: ${res.status}`, code);
  }
  return res.json() as Promise<T>;
}
