import { gzip } from "pako";

export class FetchError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor(status: number, responseBody: unknown) {
    super(`Fetch failed: ${status}`);
    this.name = "FetchError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new FetchError(res.status, body);
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  await throwIfNotOk(res);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  await throwIfNotOk(res);
  return res.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  await throwIfNotOk(res);
  return res.json();
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
  await throwIfNotOk(res);
  return res.json();
}
