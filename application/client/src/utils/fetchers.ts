export class FetchError extends Error {
  readonly status: number;
  readonly responseJSON: unknown;

  constructor(status: number, responseJSON: unknown) {
    super(`HTTP ${status}`);
    this.name = "FetchError";
    this.status = status;
    this.responseJSON = responseJSON;
  }
}

async function throwIfError(res: Response): Promise<void> {
  if (!res.ok) {
    let responseJSON: unknown = null;
    try {
      responseJSON = await res.json();
    } catch {}
    throw new FetchError(res.status, responseJSON);
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  await throwIfError(res);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  await throwIfError(res);
  return res.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    body: file,
    headers: { "Content-Type": "application/octet-stream" },
    method: "POST",
  });
  await throwIfError(res);
  return res.json();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const res = await fetch(url, {
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  await throwIfError(res);
  return res.json();
}
