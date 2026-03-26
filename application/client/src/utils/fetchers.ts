import $ from "jquery";
import { gzip } from "pako";

let binaryTransportLoaded = false;

/**
 * jquery-binarytransport を初回のみロード
 */
async function ensureBinaryTransportLoaded(): Promise<void> {
  if (binaryTransportLoaded) return;
  await import("jquery-binarytransport");
  binaryTransportLoaded = true;
}

/**
 * バイナリデータを非同期で取得
 */
export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  await ensureBinaryTransportLoaded();
  return new Promise((resolve, reject) => {
    $.ajax({
      url,
      method: "GET",
      dataType: "binary",
      responseType: "arraybuffer",
      success: resolve,
      error: (_, __, err) => reject(err),
    });
  });
}

/**
 * JSONデータを非同期で取得
 */
export async function fetchJSON<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    $.ajax({
      url,
      method: "GET",
      dataType: "json",
      success: resolve,
      error: (_, __, err) => reject(err),
    });
  });
}

/**
 * ファイルを非同期で送信
 */
export async function sendFile<T>(url: string, file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    $.ajax({
      url,
      method: "POST",
      data: file,
      dataType: "json",
      headers: { "Content-Type": "application/octet-stream" },
      processData: false,
      success: resolve,
      error: (_, __, err) => reject(err),
    });
  });
}

/**
 * JSONをgzip圧縮して非同期送信
 */
export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  return new Promise((resolve, reject) => {
    $.ajax({
      url,
      method: "POST",
      data: compressed,
      dataType: "json",
      headers: {
        "Content-Encoding": "gzip",
        "Content-Type": "application/json",
      },
      processData: false,
      success: resolve,
      error: (_, __, err) => reject(err),
    });
  });
}