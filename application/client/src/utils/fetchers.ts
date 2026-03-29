async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseJSON = await response.json().catch(() => null);
    const error = new Error(`Request failed with status ${response.status}`);
    (error as any).responseJSON = responseJSON;
    throw error;
  }
  return await response.json();
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch binary: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return handleResponse<T>(response);
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  return handleResponse<T>(response);
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: jsonString,
  });
  return handleResponse<T>(response);
}
