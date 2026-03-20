let pakoPromise: Promise<typeof import("pako")> | null = null;

async function gzipPayload(payload: Uint8Array): Promise<Uint8Array> {
  if (pakoPromise == null) {
    pakoPromise = import("pako");
  }
  const { gzip } = await pakoPromise;
  return gzip(payload);
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
  });

  if (response.ok !== true) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
  });

  if (response.ok !== true) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
    credentials: "same-origin",
  });

  if (response.ok !== true) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = await gzipPayload(uint8Array);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: new Blob([Uint8Array.from(compressed)], { type: "application/json" }),
    credentials: "same-origin",
  });

  if (response.ok !== true) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
