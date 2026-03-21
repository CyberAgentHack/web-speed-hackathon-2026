import { gzip } from "pako";

class HttpError extends Error {
  status: number;
  responseJSON: unknown;
  constructor(status: number, responseJSON: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    let responseJSON: unknown = null;
    try {
      responseJSON = await response.json();
    } catch {
      // ignore parse errors
    }
    throw new HttpError(response.status, responseJSON);
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  await throwIfNotOk(response);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    method: "POST",
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}
