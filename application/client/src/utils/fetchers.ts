import { gzip } from "pako";

export class FetchError extends Error {
  status: number;
  responseJSON: unknown;

  constructor(response: Response, body?: unknown) {
    super(`HTTP ${response.status}`);
    this.status = response.status;
    this.responseJSON = body;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    await response.body?.cancel();
    throw new FetchError(response);
  }
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    await response.body?.cancel();
    throw new FetchError(response);
  }
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new FetchError(response);
  }
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: compressed,
  });
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // body is not JSON
    }
    throw new FetchError(response, body);
  }
  return response.json() as Promise<T>;
}
