export class HTTPError extends Error {
  readonly body: unknown;
  readonly status: number;

  constructor(response: Response, body: unknown) {
    super(`Request failed: ${response.status}`);
    this.body = body;
    this.name = "HTTPError";
    this.status = response.status;
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function parseJSONResponse<T>(response: Response): Promise<T> {
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new HTTPError(response, body);
  }

  return body as T;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    ...init,
  });

  return parseJSONResponse<T>(response);
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });

  return parseJSONResponse<T>(response);
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseJSONResponse<T>(response);
}
