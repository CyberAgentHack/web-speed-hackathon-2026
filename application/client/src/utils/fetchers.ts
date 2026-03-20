import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return await response.json();
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
  if (!response.ok) throw new Error(`Post failed: ${response.status}`);
  return await response.json();
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
  if (!response.ok) throw new Error(`Post failed: ${response.status}`);
  return await response.json();
}
