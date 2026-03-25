class FetchError extends Error {
  responseJSON: unknown;
  status: number;
  constructor(status: number, responseJSON: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new FetchError(response.status, null);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) {
    let body: unknown = null;
    try { body = await response.json(); } catch {}
    throw new FetchError(response.status, body);
  }
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!response.ok) {
    let body: unknown = null;
    try { body = await response.json(); } catch {}
    throw new FetchError(response.status, body);
  }
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let body: unknown = null;
    try { body = await response.json(); } catch {}
    throw new FetchError(response.status, body);
  }
  return response.json() as Promise<T>;
}
