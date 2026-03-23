export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchBinary failed: ${res.status} ${res.statusText}`);
  }
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchJSON failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

class FetchError extends Error {
  responseJSON: unknown;
  constructor(status: number, responseJSON: unknown) {
    super(`Request failed: ${status}`);
    this.responseJSON = responseJSON;
  }
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new FetchError(res.status, json);
  }
  return json as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);

  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  void writer.write(uint8Array);
  void writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: compressed,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new FetchError(res.status, json);
  }
  return json as T;
}
