import { gzip } from "pako";

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

declare global {
  interface Window {
    __PREFETCH__?: Record<string, Promise<unknown>>;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });
  if (!response.ok) {
    throw new HttpError(response.status, await parseResponseBody(response));
  }
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const prefetched = window.__PREFETCH__?.[url];
  if (prefetched != null) {
    delete window.__PREFETCH__?.[url];
    try {
      return (await prefetched) as T;
    } catch {
      // Fallback to normal fetch when prefetch failed.
    }
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });
  const body = await parseResponseBody(response);
  if (!response.ok) {
    throw new HttpError(response.status, body);
  }
  return body as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  const body = await parseResponseBody(response);
  if (!response.ok) {
    throw new HttpError(response.status, body);
  }
  return body as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    body: compressed,
    credentials: "same-origin",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = await parseResponseBody(response);
  if (!response.ok) {
    throw new HttpError(response.status, body);
  }
  return body as T;
}
