import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw res;
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw res;
  return res.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) throw res;
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
  if (!res.ok) throw res;
  return res.json();
}
