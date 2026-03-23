async function checkOk(res: Response): Promise<Response> {
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`) as Error & {
      responseJSON?: unknown;
      status?: number;
    };
    error.status = res.status;
    try {
      // jQuery.ajax のエラーオブジェクト互換（AuthModalContainer 側で参照している）
      error.responseJSON = await res.clone().json();
    } catch {
      // JSON でない失敗レスポンスは従来どおり汎用エラーとして扱う
    }
    throw error;
  }
  return res;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url).then(checkOk);
  return res.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url).then(checkOk);
  return res.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  }).then(checkOk);
  return res.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  // サーバーは bodyParser.json() のみ。gzip はバンドル・CPU 負荷の割に効果が薄いので素の JSON を送る。
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then(checkOk);
  return res.json() as Promise<T>;
}
