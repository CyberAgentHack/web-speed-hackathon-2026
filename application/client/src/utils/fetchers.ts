import { gzip } from "pako";

export class HttpError extends Error {
  status: number;

  statusText: string;

  bodyText: string;

  constructor(status: number, statusText: string, bodyText: string) {
    super(`HTTP ${status} ${statusText}${bodyText ? `: ${bodyText}` : ""}`);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.bodyText = bodyText;
  }
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const errorBody = await response.text().catch(() => "");
  throw new HttpError(response.status, response.statusText, errorBody);
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
  });
  await throwIfNotOk(response);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
  });
  await throwIfNotOk(response);
  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  await throwIfNotOk(response);
  return (await response.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  await throwIfNotOk(response);
  return (await response.json()) as T;
}
