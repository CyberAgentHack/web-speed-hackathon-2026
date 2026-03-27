import { gzip } from "pako";

async function ensureOK(response: Response): Promise<Response> {
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
  });
  await ensureOK(response);
  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });
  await ensureOK(response);
  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  await ensureOK(response);
  return (await response.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: compressed,
  });
  await ensureOK(response);
  return (await response.json()) as T;
}