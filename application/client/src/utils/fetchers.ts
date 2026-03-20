import $ from "jquery";
import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const result = await fetch(url, {
    method: "GET",
  });
  const buffer = await result.arrayBuffer();
  return buffer;
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const result = await fetch(url, {
    method: "GET",
  });
  const json = await result.json();
  return json;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const result = await $.ajax({
    async: false,
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
    async: false,
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
