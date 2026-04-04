async function parseResponseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text.length === 0) {
    return {};
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await parseResponseJson(res)) as T;
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`) as Error & { responseJSON?: unknown };
    err.responseJSON = json;
    throw err;
  }
  return json;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const json = (await parseResponseJson(res)) as T;
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`) as Error & { responseJSON?: unknown };
    err.responseJSON = json;
    throw err;
  }
  return json;
}
