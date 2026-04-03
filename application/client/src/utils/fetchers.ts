function ensureOk(response: Response): Response {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = ensureOk(await fetch(url));
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = ensureOk(await fetch(url));
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = ensureOk(await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  }));
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = ensureOk(await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }));
  return response.json() as Promise<T>;
}
