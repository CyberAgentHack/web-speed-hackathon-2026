async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw body;
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
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  await throwIfNotOk(res);
  return res.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const { gzip } = await import("pako");
  const compressed = gzip(new TextEncoder().encode(JSON.stringify(data)));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Encoding": "gzip", "Content-Type": "application/json" },
    body: compressed,
  });
  await throwIfNotOk(res);
  return res.json() as Promise<T>;
}
