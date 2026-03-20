async function fetchOrThrow(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetchOrThrow(url);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetchOrThrow(url);
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetchOrThrow(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  return response.json() as Promise<T>;
}

async function gzip(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  void writer.write(data);
  void writer.close();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result as Uint8Array<ArrayBuffer>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString) as Uint8Array<ArrayBuffer>;
  const compressed = await gzip(uint8Array);

  const response = await fetchOrThrow(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return response.json() as Promise<T>;
}
