import $ from "jquery";
import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const result = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  const buffer = await result.arrayBuffer();
  return buffer;
}

export async function fetchJSON<T>(
  url: string,
  query?: Record<string, string>,
): Promise<T> {
  const result = await fetch(
    query ? `${url}?${new URLSearchParams(query).toString()}` : url,
    {
      method: "GET",
      credentials: "include",
    },
  );
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  const json = await result.json();
  return json;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
    credentials: "include",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  const json = await result.json();
  return json;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const result = await $.ajax({
    async: false,
    data: compressed,
    dataType: "json",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
    processData: false,
    url,
  });
  return result;
}
