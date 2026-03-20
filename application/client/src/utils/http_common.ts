type ParsedBody = ArrayBuffer | null | Record<string, unknown> | unknown[] | unknown;

export class HttpError extends Error {
  readonly responseJSON: ParsedBody;
  readonly status: number;

  constructor(status: number, statusText: string, responseJSON: ParsedBody) {
    super(statusText || `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

async function parseJsonResponse(response: Response): Promise<ParsedBody> {
  const text = await response.text();
  if (text === "") {
    return null;
  }

  try {
    return JSON.parse(text) as ParsedBody;
  } catch {
    return text;
  }
}

export async function request<T>(
  url: string,
  init: RequestInit,
  responseType: "arraybuffer" | "json",
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
  });

  if (responseType === "arraybuffer") {
    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, null);
    }
    return (await response.arrayBuffer()) as T;
  }

  const parsed = await parseJsonResponse(response);
  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, parsed);
  }
  return parsed as T;
}
