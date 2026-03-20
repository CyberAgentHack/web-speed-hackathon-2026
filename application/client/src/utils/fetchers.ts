import { gzip } from "pako";

export class HttpError extends Error {
  status: number;
  responseJSON: unknown;
  responseText: string | null;

  constructor(message: string, status: number, responseJSON: unknown, responseText: string | null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.responseJSON = responseJSON;
    this.responseText = responseText;
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchWithError(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
  });

  if (!res.ok) {
    const body = await parseBody(res);
    throw new HttpError(res.statusText || "Request failed", res.status, body, typeof body === "string" ? body : null);
  }

  return res;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetchWithError(url, {
    method: "GET",
  });
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetchWithError(url, {
    method: "GET",
  });
  return (await parseBody(res)) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetchWithError(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  return (await parseBody(res)) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const res = await fetchWithError(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return (await parseBody(res)) as T;
}
