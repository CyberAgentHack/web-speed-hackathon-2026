export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const result = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  const buffer = await result.arrayBuffer();
  return buffer;
}

export async function fetchJSON<T>(
  url: string,
  query?: Record<string, string>,
): Promise<T> {
  const result = await fetch(
    query ? `${url}?${new URLSearchParams(query).toString()}` : url,
    {
      method: "GET",
      credentials: "include",
    },
  );
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  const json = await result.json();
  return json;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
    credentials: "include",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  const json = await result.json();
  return json;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!result.ok) {
    throw new Error(`Failed to fetch: ${result.status} ${result.statusText}`);
  }
  return result.json() as Promise<T>;
}
