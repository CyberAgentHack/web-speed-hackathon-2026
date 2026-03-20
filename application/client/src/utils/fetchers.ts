export class FetchError extends Error {
  responseJSON: unknown;
  status: number;

  constructor({
    responseJSON,
    status,
    statusText,
  }: {
    responseJSON: unknown;
    status: number;
    statusText: string;
  }) {
    super(`Request failed with status ${status} ${statusText}`);
    this.name = "FetchError";
    this.responseJSON = responseJSON;
    this.status = status;
  }
}

async function parseErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  if (!response.ok) {
    const responseJSON = await parseErrorBody(response);
    throw new FetchError({ responseJSON, status: response.status, statusText: response.statusText });
  }

  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await request(url);
  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await request(url);
  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await request(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  return (await response.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const { gzip } = await import("pako");
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await request(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return (await response.json()) as T;
}
