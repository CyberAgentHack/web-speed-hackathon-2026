export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const uint8Array = new TextEncoder().encode(JSON.stringify(data));
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  await writer.write(uint8Array);
  await writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: compressed,
  });
  if (!response.ok) {
    const error: Error & { responseJSON?: unknown } = new Error(`HTTP ${response.status}`);
    error.responseJSON = await response.json().catch(() => null);
    throw error;
  }
  return response.json() as Promise<T>;
}
