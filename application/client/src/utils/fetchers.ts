import { gzip } from "pako";

export class HttpError extends Error {
  status: number;
  responseJSON: unknown;
  constructor(status: number, responseJSON: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new HttpError(res.status, body);
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
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  await throwIfNotOk(res);
  return res.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const res = await fetch(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  await throwIfNotOk(res);
  return res.json() as Promise<T>;
}
