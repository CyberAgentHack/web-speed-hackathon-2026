import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  return res.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const compressed = gzip(new TextEncoder().encode(JSON.stringify(data)));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Encoding": "gzip", "Content-Type": "application/json" },
    body: compressed,
  });
  return res.json() as Promise<T>;
}
