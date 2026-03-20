import { gzip } from "pako";

class RequestError extends Error {
  responseJSON?: unknown;
  status: number;
  statusText: string;

  constructor({
    responseText = "",
    status,
    statusText,
  }: {
    responseText?: string;
    status: number;
    statusText: string;
  }) {
    super(`Request failed: ${status} ${statusText}`);
    this.name = "RequestError";
    this.status = status;
    this.statusText = statusText;

    if (responseText.length > 0) {
      try {
        this.responseJSON = JSON.parse(responseText);
      } catch {
        this.responseJSON = undefined;
      }
    }
  }
}

async function requestArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new RequestError({
      responseText: await response.text(),
      status: response.status,
      statusText: response.statusText,
    });
  }

  return response.arrayBuffer();
}

function requestJSON<T>({
  body,
  headers,
  method,
  url,
}: {
  body?: Blob | BufferSource | File;
  headers?: Record<string, string>;
  method: "GET" | "POST";
  url: string;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    for (const [key, value] of Object.entries(headers ?? {})) {
      xhr.setRequestHeader(key, value);
    }

    try {
      xhr.send(body ?? null);
    } catch (error) {
      reject(error);
      return;
    }

    if (xhr.status < 200 || xhr.status >= 300) {
      reject(
        new RequestError({
          responseText: xhr.responseText,
          status: xhr.status,
          statusText: xhr.statusText,
        }),
      );
      return;
    }

    resolve(JSON.parse(xhr.responseText) as T);
  });
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  return requestArrayBuffer(url);
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new RequestError({
      responseText: await response.text(),
      status: response.status,
      statusText: response.statusText,
    });
  }

  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  return requestJSON<T>({
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
    url,
  });
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  return requestJSON<T>({
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
    url,
  });
}
