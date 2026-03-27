import $ from "jquery";
import { gzip } from "pako";

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

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const result = await $.ajax({
    dataType: "binary",
    method: "GET",
    responseType: "arraybuffer",
    url,
  });
  return result;
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

  const result = await $.ajax({
    dataType: "json",
    method: "GET",
    url,
  });
  return result;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const result = await $.ajax({
    data: file,
    dataType: "json",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
    processData: false,
    url,
  });
  return result;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const result = await $.ajax({
    data: compressed,
    dataType: "json",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
    processData: false,
    url,
  });
  return result;
}
