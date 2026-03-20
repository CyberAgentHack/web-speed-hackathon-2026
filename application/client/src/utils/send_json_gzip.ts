import { request } from "@web-speed-hackathon-2026/client/src/utils/http_common";

async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  let totalLength = 0;
  for (const chunk of chunks) totalLength += chunk.byteLength;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = await compressGzip(uint8Array);

  return request<T>(
    url,
    {
      body: compressed,
      headers: {
        Accept: "application/json",
        "Content-Encoding": "gzip",
        "Content-Type": "application/json",
      },
      method: "POST",
    },
    "json",
  );
}
