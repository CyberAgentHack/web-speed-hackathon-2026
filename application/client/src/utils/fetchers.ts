export const fetchBinary = async (url: string): Promise<ArrayBuffer> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.arrayBuffer();
};

export const fetchJSON = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw await res
      .json()
      .catch(() => new Error(`${res.status} ${res.statusText}`));
  }

  return res.json() satisfies Promise<T>;
};

export const sendFile = async <T>(url: string, file: File): Promise<T> => {
  const res = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  if (!res.ok) {
    throw await res
      .json()
      .catch(() => new Error(`${res.status} ${res.statusText}`));
  }

  return res.json() satisfies Promise<T>;
};

const compress = async (data: ArrayBuffer): Promise<ArrayBuffer> => {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));

  return new Response(stream).arrayBuffer();
};

export const sendJSON = async <T>(url: string, data: object): Promise<T> => {
  const jsonString = JSON.stringify(data);
  const encoded = new TextEncoder().encode(jsonString);
  const compressed = await compress(encoded.buffer);

  const res = await fetch(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!res.ok) {
    throw await res
      .json()
      .catch(() => new Error(`${res.status} ${res.statusText}`));
  }

  return res.json() satisfies Promise<T>;
};
