import { gzip } from "pako";

interface APIError {
  code?: unknown;
}

interface APIErrorBody {
  code?: unknown;
}

export class FetcherError extends Error {
  responseJSON: APIError | null;

  constructor(message: string, responseJSON: APIError | null) {
    super(message);
    this.name = "FetcherError";
    this.responseJSON = responseJSON;
  }
}

async function parseErrorJSON(response: Response): Promise<APIError | null> {
  try {
    const body = (await response.json()) as APIErrorBody;
    if (typeof body !== "object" || body === null) {
      return null;
    }
    return { code: body.code };
  } catch {
    return null;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) {
    throw new FetcherError(`Failed to fetch binary: ${response.status}`, await parseErrorJSON(response));
  }

  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) {
    throw new FetcherError(`Failed to fetch JSON: ${response.status}`, await parseErrorJSON(response));
  }

  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    credentials: "include",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new FetcherError(`Failed to send file: ${response.status}`, await parseErrorJSON(response));
  }

  return (await response.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    body: compressed,
    credentials: "include",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new FetcherError(`Failed to send JSON: ${response.status}`, await parseErrorJSON(response));
  }

  return (await response.json()) as T;
}
