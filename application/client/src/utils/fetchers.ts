export class HttpError extends Error {
  override name = "HttpError";
  status: number;
  responseJSON: unknown;

  constructor(status: number, responseJSON?: unknown) {
    super(`${status}`);
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

async function tryParseJSON(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return undefined;
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const responseJSON = await tryParseJSON(res);
    throw new HttpError(res.status, responseJSON);
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  await throwIfNotOk(res);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  await throwIfNotOk(res);
  return res.json();
}

export async function sendFile<T>(url: string, file: Blob): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await throwIfNotOk(res);
  return res.json();
}
