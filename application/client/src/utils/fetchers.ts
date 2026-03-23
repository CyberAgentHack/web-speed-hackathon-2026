export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return await res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return await res.json();
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
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return await res.json();
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
    let responseJSON: unknown;
    try {
      responseJSON = await res.json();
    } catch {
      responseJSON = undefined;
    }
    const error = new Error(`HTTP error! status: ${res.status}`) as Error & {
      responseJSON?: unknown;
      status: number;
    };
    error.status = res.status;
    error.responseJSON = responseJSON;
    throw error;
  }

  return await res.json();
}

export async function sendPOST<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return await res.json();
}
