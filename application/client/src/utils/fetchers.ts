import { gzip } from "pako";

class FetchError extends Error {
  responseJSON: unknown;
  status: number;
  constructor(message: string, status: number, responseJSON: unknown) {
    super(message);
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

async function throwIfNotOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    let responseJSON: unknown = null;
    try {
      responseJSON = await response.json();
    } catch {}
    throw new FetchError(`${label} failed: ${response.status}`, response.status, responseJSON);
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  await throwIfNotOk(response, "fetchBinary");
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  await throwIfNotOk(response, "fetchJSON");
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
  await throwIfNotOk(response, "sendFile");
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
  await throwIfNotOk(response, "sendJSON");
  return response.json() as Promise<T>;
}
