import { request } from "@web-speed-hackathon-2026/client/src/utils/http_common";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  return request<ArrayBuffer>(url, { method: "GET" }, "arraybuffer");
}

export async function fetchJSON<T>(url: string): Promise<T> {
  return request<T>(
    url,
    {
      headers: {
        Accept: "application/json",
      },
      method: "GET",
    },
    "json",
  );
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  return request<T>(
    url,
    {
      body: file,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
      },
      method: "POST",
    },
    "json",
  );
}
