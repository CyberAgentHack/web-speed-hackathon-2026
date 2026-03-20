export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw res;
  return res.arrayBuffer();
}

declare global {
  interface Window {
    __PREFETCH__?: Record<string, unknown>;
  }
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const key = url.startsWith("/") ? url : new URL(url, location.origin).pathname + new URL(url, location.origin).search;
  if (window.__PREFETCH__ && key in window.__PREFETCH__) {
    const data = window.__PREFETCH__[key] as T;
    delete window.__PREFETCH__[key];
    return data;
  }
  const res = await fetch(url);
  if (!res.ok) throw res;
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw res;
  return res.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw res;
  return res.json() as Promise<T>;
}
