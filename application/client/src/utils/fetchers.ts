interface ParsedResponseBody {
  responseJSON: unknown;
  responseText: string | null;
}

interface HttpErrorOptions<T> {
  responseJSON: T | null;
  responseText: string | null;
  status: number;
}

export class HttpError<T = unknown> extends Error {
  responseJSON: T | null;
  responseText: string | null;
  status: number;

  constructor(message: string, options: HttpErrorOptions<T>) {
    super(message);
    this.name = "HttpError";
    this.responseJSON = options.responseJSON;
    this.responseText = options.responseText;
    this.status = options.status;
  }
}

async function parseResponseBody(response: Response): Promise<ParsedResponseBody> {
  const responseText = await response.text();
  if (responseText === "") {
    return {
      responseJSON: null,
      responseText: null,
    };
  }

  try {
    return {
      responseJSON: JSON.parse(responseText),
      responseText,
    };
  } catch {
    return {
      responseJSON: null,
      responseText,
    };
  }
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
  });

  if (response.ok) {
    return response;
  }

  const { responseJSON, responseText } = await parseResponseBody(response);
  throw new HttpError(`Request failed with status ${response.status}`, {
    responseJSON,
    responseText,
    status: response.status,
  });
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await request(url);
  return response.arrayBuffer();
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
  const response = await request(url, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return (await response.json()) as T;
}
