export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw await res.json();
  }
  return await res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw await res.json();
  }
  return await res.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: new Blob([file]),
  });
  if (!res.ok) {
    throw await res.json();
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
    throw await res.json();
  }
  return await res.json();
}
