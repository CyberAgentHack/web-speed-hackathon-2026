import { gzip } from "pako";

type ResponseJSON = Record<string, unknown> | null;

export class HTTPError extends Error {
  responseJSON: ResponseJSON;
  status: number;

  constructor({
    message,
    responseJSON,
    status,
  }: {
    message: string;
    responseJSON: ResponseJSON;
    status: number;
  }) {
    super(message);
    this.name = "HTTPError";
    this.responseJSON = responseJSON;
    this.status = status;
  }
}

async function parseJSONResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (text === "") {
    return null as T;
  }
  return JSON.parse(text) as T;
}

async function parseErrorResponse(response: Response): Promise<never> {
  let responseJSON: ResponseJSON = null;

  try {
    responseJSON = await parseJSONResponse<ResponseJSON>(response);
  } catch {
    responseJSON = null;
  }

  throw new HTTPError({
    message:
      typeof responseJSON?.["message"] === "string"
        ? responseJSON["message"]
        : response.statusText,
    responseJSON,
    status: response.status,
  });
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });

  if (!response.ok) {
    return parseErrorResponse(response);
  }

  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });

  if (!response.ok) {
    return parseErrorResponse(response);
  }

  return parseJSONResponse<T>(response);
}

export async function sendFile<T>(
  url: string,
  file: File,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(url, {
    body: file,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/octet-stream",
      ...headers,
    },
    method: "POST",
  });

  if (!response.ok) {
    return parseErrorResponse(response);
  }

  return parseJSONResponse<T>(response);
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    body: compressed,
    credentials: "same-origin",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return parseErrorResponse(response);
  }

  return parseJSONResponse<T>(response);
}
