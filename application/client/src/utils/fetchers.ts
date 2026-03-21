import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const result = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch binary: ${result.status}`);
  }
  return await result.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const result = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch JSON: ${result.status}`);
  }
  return (await result.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const result = await fetch(url, {
    body: file,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  if (!result.ok) {
    throw new Error(`Failed to upload file: ${result.status}`);
  }
  return (await result.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const result = await fetch(url, {
    body: compressed,
    credentials: "same-origin",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!result.ok) {
    throw new Error(`Failed to send JSON: ${result.status}`);
  }
  return (await result.json()) as T;
}
