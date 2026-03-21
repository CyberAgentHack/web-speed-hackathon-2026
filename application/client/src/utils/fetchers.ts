interface FetchError extends Error {
  response: Response;
  responseJSON?: unknown;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    const error: FetchError = new Error(response.statusText) as FetchError;
    error.response = response;
    throw error;
  }
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const error: FetchError = new Error(response.statusText) as FetchError;
    error.response = response;
    error.responseJSON = await response.json().catch(() => null);
    throw error;
  }
  return response.json() as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!response.ok) {
    const error: FetchError = new Error(response.statusText) as FetchError;
    error.response = response;
    error.responseJSON = await response.json().catch(() => null);
    throw error;
  }
  return response.json() as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const error: FetchError = new Error(response.statusText) as FetchError;
    error.response = response;
    error.responseJSON = await response.json().catch(() => null);
    throw error;
  }
  return response.json() as T;
}
