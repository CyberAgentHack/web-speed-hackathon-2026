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
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);

  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(uint8Array);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();

  const response = await fetch(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw Object.assign(new Error(`HTTP ${response.status}`), { responseJSON: body });
  }
  return response.json() as Promise<T>;
}
