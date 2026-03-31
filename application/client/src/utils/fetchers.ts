export interface FetchOptions {
  signal?: AbortSignal;
}

export class FetchError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.payload = payload;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
  });

  if (response.ok) {
    return response;
  }

  const payload = await parseResponsePayload(response);
  const message =
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : response.statusText || "Request failed";

  throw new FetchError(response.status, message, payload);
}

export async function fetchBinary(url: string, options: FetchOptions = {}): Promise<ArrayBuffer> {
  const response = await request(url, {
    headers: {
      Accept: "application/octet-stream",
    },
    method: "GET",
    signal: options.signal,
  });
  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await request(url, {
    headers: {
      Accept: "application/json",
    },
    method: "GET",
    signal: options.signal,
  });
  return (await response.json()) as T;
}

export async function sendFile<T>(
  url: string,
  file: File,
  options: FetchOptions = {},
): Promise<T> {
  const response = await request(url, {
    body: file,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
    signal: options.signal,
  });
  return (await response.json()) as T;
}

export async function sendJSON<T>(
  url: string,
  data: object,
  options: FetchOptions = {},
): Promise<T> {
  const response = await request(url, {
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: options.signal,
  });
  return (await response.json()) as T;
}
