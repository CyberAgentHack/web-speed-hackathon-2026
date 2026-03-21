export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBinary failed: ${res.status}`);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const prefetched = (window as Record<string, unknown>).__prefetchPromise as Record<string, Promise<Response>> | undefined;
  let res: Response;
  if (prefetched?.[url]) {
    res = await prefetched[url]!;
    delete prefetched[url];
  } else {
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`fetchJSON failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) throw new Error(`sendFile failed: ${res.status}`);
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
  if (!res.ok) {
    let responseJSON: unknown = null;
    try {
      responseJSON = await res.json();
    } catch {}
    const err = new Error(`sendJSON failed: ${res.status}`);
    (err as any).responseJSON = responseJSON;
    throw err;
  }
  return res.json() as Promise<T>;
}
