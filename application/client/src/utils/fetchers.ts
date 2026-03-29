async function ensureOk(response: Response): Promise<Response> {
  if (response.ok) {
    return response;
  }

  const message = await response.text();
  throw new Error(message || `${response.status} ${response.statusText}`);
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    credentials: "same-origin",
    method: "GET",
  });
  return (await ensureOk(response)).arrayBuffer();
}

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    method: "GET",
  });
  return (await ensureOk(response)).json() as Promise<T>;
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
  return (await ensureOk(response)).json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const { gzip } = await import("pako");
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
  return (await ensureOk(response)).json() as Promise<T>;
}
