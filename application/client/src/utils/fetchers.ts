export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  return res.json() as Promise<T>;
}

async function gzipCompress(data: Uint8Array): Promise<ArrayBuffer> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  void writer.write(data);
  void writer.close();
  return new Response(cs.readable).arrayBuffer();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);

  // 小さいペイロードはgzip不要（圧縮オーバーヘッドの方が大きい）
  const useGzip = jsonString.length > 1024;
  const body = useGzip
    ? await gzipCompress(new TextEncoder().encode(jsonString))
    : jsonString;

  const res = await fetch(url as string | URL, {
    method: "POST",
    headers: {
      ...(useGzip ? { "Content-Encoding": "gzip" } : {}),
      "Content-Type": "application/json",
    },
    body,
  });
  return res.json() as Promise<T>;
}
