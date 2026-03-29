/**
 * HTTP通信ユーティリティ。
 * fetch APIを使用し、メインスレッドをブロックしない非同期通信を行う。
 * HTTPエラー（4xx/5xx）時は例外を投げる（jQuery.ajaxと同等の挙動）。
 */

/** HTTPエラー時に例外を投げる共通チェック */
function assertOk(res: Response): void {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
}

/** 指定URLからバイナリデータを取得する */
export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  assertOk(res);
  return res.arrayBuffer();
}

/** 指定URLからJSONデータを取得する */
export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  assertOk(res);
  return res.json() as Promise<T>;
}

/** 指定URLにファイルをPOST送信する */
export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
  assertOk(res);
  return res.json() as Promise<T>;
}

/** 指定URLにJSONデータをPOST送信する */
export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  assertOk(res);
  return res.json() as Promise<T>;
}
