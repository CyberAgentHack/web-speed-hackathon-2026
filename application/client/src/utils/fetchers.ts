import { gzip } from "pako";

export class FetchError extends Error {
  responseJSON: unknown;
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.responseJSON = body;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    throw new FetchError(res.status, body);
  }
  return body as T;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return handleResponse<T>(res);
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  return handleResponse<T>(res);
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: compressed,
  });
  return handleResponse<T>(res);
}
