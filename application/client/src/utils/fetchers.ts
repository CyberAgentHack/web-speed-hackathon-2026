async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = Object.assign(new Error(`HTTP ${response.status}`), {
      responseJSON: body,
      status: response.status,
    });
    throw error;
  }
  return response;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url).then(ensureOk);
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url).then(ensureOk);
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  }).then(ensureOk);
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then(ensureOk);
  return response.json() as Promise<T>;
}
