import { gzip } from "pako";

export class FetchError extends Error {
  responseJSON: unknown;
  status: number;

  constructor(message: string, status: number, responseJSON: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
  return response.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!response.ok) throw new Error(`Failed to send: ${response.statusText}`);
  return response.json();
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
    let responseJSON: unknown = null;
    try {
      responseJSON = await response.json();
    } catch {
      // ignore JSON parse errors
    }
    throw new FetchError(`Failed to send: ${response.statusText}`, response.status, responseJSON);
  }

  return response.json();
}
