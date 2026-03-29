import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer;
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json;
}

export async function fetchJSONList<T>(url: string, offset: number, limit: number): Promise<T> {
  const paginatedUrl = `${url}?offset=${offset}&limit=${limit}`;
  const response = await fetch(paginatedUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${paginatedUrl}: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(
      `Failed to send file to ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json;
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
    throw new Error(
      `Failed to send JSON to ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json;
}
