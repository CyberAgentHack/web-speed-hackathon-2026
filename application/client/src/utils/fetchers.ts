import { gzip } from "pako";

async function fetchOrThrow(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetchOrThrow(url);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetchOrThrow(url);
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetchOrThrow(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetchOrThrow(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return response.json() as Promise<T>;
}
