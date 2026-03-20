import { gzip } from "pako";

class RequestError extends Error {
  responseJSON?: unknown;
  status: number;
  statusText: string;

  constructor(xhr: XMLHttpRequest) {
    super(`Request failed: ${xhr.status} ${xhr.statusText}`);
    this.name = "RequestError";
    this.status = xhr.status;
    this.statusText = xhr.statusText;

    if (xhr.responseText.length > 0) {
      try {
        this.responseJSON = JSON.parse(xhr.responseText);
      } catch {
        this.responseJSON = undefined;
      }
    }
  }
}

function requestArrayBuffer(url: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.overrideMimeType("text/plain; charset=x-user-defined");

    try {
      xhr.send();
    } catch (error) {
      reject(error);
      return;
    }

    if (xhr.status < 200 || xhr.status >= 300) {
      reject(new RequestError(xhr));
      return;
    }

    const responseText = xhr.responseText;
    const buffer = new Uint8Array(responseText.length);
    for (let index = 0; index < responseText.length; index += 1) {
      buffer[index] = responseText.charCodeAt(index) & 0xff;
    }

    resolve(buffer.buffer);
  });
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
      reject(new RequestError(xhr));
      return;
    }

    resolve(JSON.parse(xhr.responseText) as T);
  });
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  return requestArrayBuffer(url);
}

export async function fetchJSON<T>(url: string): Promise<T> {
  return requestJSON<T>({ method: "GET", url });
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
