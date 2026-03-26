async function compressGzip(data: Uint8Array): Promise<ArrayBuffer> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  void writer.write(new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength));
  void writer.close();
  return new Response(cs.readable).arrayBuffer();
}

async function ensureOk(res: Response): Promise<Response> {
  if (!res.ok) {
    let responseJSON: unknown;
    try {
      responseJSON = await res.json();
    } catch {
      // ignore parse errors
    }
    const err = new Error(`HTTP ${res.status}`) as Error & { responseJSON: unknown };
    err.responseJSON = responseJSON;
    throw err;
  }
  return res;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return (await ensureOk(res)).arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return (await ensureOk(res)).json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  return (await ensureOk(res)).json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = await compressGzip(uint8Array);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: compressed,
  });
  return (await ensureOk(res)).json() as Promise<T>;
}
