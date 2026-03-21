type HttpError = Error & {
  responseJSON?: unknown;
  responseText?: string;
  status: number;
};

// サーバー側でHTMLに注入されたプリロードデータキャッシュ
const _preloadCache: Record<string, unknown> =
  typeof window !== "undefined" ? ((window as unknown as Record<string, unknown>).__PRELOAD_DATA__ as Record<string, unknown>) ?? {} : {};

function consumePreloaded<T>(url: string): { found: true; data: T } | { found: false } {
  if (url in _preloadCache) {
    const data = _preloadCache[url] as T;
    delete _preloadCache[url];
    return { found: true, data };
  }
  return { found: false };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    let responseJSON: unknown;
    let responseText = "";
    if (contentType.includes("application/json")) {
      responseJSON = await response.json();
      responseText =
        typeof responseJSON === "string" ? responseJSON : JSON.stringify(responseJSON);
    } else {
      responseText = await response.text();
    }

    const error = new Error(
      responseText || `Request failed with status ${response.status}`,
    ) as HttpError;
    error.status = response.status;
    error.responseJSON = responseJSON;
    error.responseText = responseText;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed with status ${response.status}`);
  }
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const preloaded = consumePreloaded<T>(url);
  if (preloaded.found) {
    if (preloaded.data === null) {
      // null はサーバーサイドで「認証エラー/Not Found」を意味する
      throw Object.assign(new Error("Preload: null response"), { status: 401 });
    }
    return preloaded.data;
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  return parseResponse<T>(response);
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  return parseResponse<T>(response);
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return parseResponse<T>(response);
}
