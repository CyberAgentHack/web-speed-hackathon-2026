/**
 * Orval 出力が前提とする fetch ラッパー。
 * GET でも 4xx を reject せず、`{ data, status, headers }` で返す。
 */
export async function orvalFetcher<T>(url: string, init: RequestInit = {}): Promise<T> {
  const path = url.startsWith("http") ? url : `/api/v1${url}`;
  const res = await fetch(path, init);

  let data: unknown;
  if (res.status === 204) {
    data = undefined;
  } else {
    const ct = res.headers.get("content-type");
    if (ct?.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  }

  return {
    data,
    status: res.status,
    headers: res.headers,
  } as T;
}
