export class HttpError extends Error {
  responseJSON?: unknown;
  responseText?: string;
  status: number;
  statusText: string;

  constructor(params: {
    responseJSON?: unknown;
    responseText?: string;
    status: number;
    statusText: string;
  }) {
    super(`Request failed: ${params.status} ${params.statusText}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "HttpError";
    this.responseJSON = params.responseJSON;
    this.responseText = params.responseText;
    this.status = params.status;
    this.statusText = params.statusText;
  }
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (response.ok) {
    return response;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const responseText = await response.text().catch(() => "");
  let responseJSON: unknown;

  if (responseText !== "" && contentType.includes("application/json")) {
    try {
      responseJSON = JSON.parse(responseText);
    } catch {
      responseJSON = undefined;
    }
  }

  throw new HttpError({
    responseJSON,
    responseText: responseText === "" ? undefined : responseText,
    status: response.status,
    statusText: response.statusText,
  });
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await request(url, { method: "GET" });
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await request(url, { method: "GET" });
  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  return (await response.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return (await response.json()) as T;
}
