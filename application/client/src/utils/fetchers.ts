import { gzip } from "pako";

export class HTTPError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly responseJSON: unknown;
  readonly responseText: string;

  public constructor(response: Response, responseText: string, responseJSON: unknown) {
    const errorMessage = responseText.length > 0 ? `: ${responseText}` : "";
    super(`HTTP ${response.status} ${response.statusText}${errorMessage}`);
    this.name = "HTTPError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.responseJSON = responseJSON;
    this.responseText = responseText;
  }
}

const ensureResponseOk = async (response: Response): Promise<void> => {
  if (response.ok) {
    return;
  }

  const responseText = await response.text().catch(() => "");
  let responseJSON: unknown = null;
  if (responseText.length > 0) {
    try {
      responseJSON = JSON.parse(responseText);
    } catch {
      responseJSON = null;
    }
  }
  throw new HTTPError(response, responseText, responseJSON);
};

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
  });
  await ensureResponseOk(response);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
  });
  await ensureResponseOk(response);
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
  await ensureResponseOk(response);
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
  await ensureResponseOk(response);
  return (await response.json()) as T;
}
