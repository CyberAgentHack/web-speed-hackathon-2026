export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}

declare global {
  interface Window {
    __PREFETCH__?: Record<string, Promise<unknown>>;
  }
}

export async function fetchJSON<T>(url: string): Promise<T> {
  // プリフェッチ済みデータがあればそれを使う
  const prefetched = window.__PREFETCH__?.[url];
  if (prefetched) {
    delete window.__PREFETCH__![url];
    return prefetched as Promise<T>;
  }
  const response = await fetch(url);
  if (!response.ok) throw await response.json().catch(() => new Error(response.statusText));
  return response.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!response.ok) throw await response.json().catch(() => new Error(response.statusText));
  return response.json();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await response.json().catch(() => new Error(response.statusText));
  return response.json();
}
