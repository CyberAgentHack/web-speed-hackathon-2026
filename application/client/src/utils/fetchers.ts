async function parseJSONResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
  });

  return parseJSONResponse<T>(response);
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });

  return parseJSONResponse<T>(response);
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseJSONResponse<T>(response);
}
