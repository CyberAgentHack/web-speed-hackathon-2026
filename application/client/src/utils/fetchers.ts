import { gzip } from "pako";

type JQueryModule = typeof import("jquery");
type JQueryStatic = JQueryModule extends { default: infer T }
  ? T
  : JQueryModule;

let jqueryPromise: Promise<JQueryStatic> | null = null;
let jqueryBinaryTransportPromise: Promise<void> | null = null;

async function getJQuery(): Promise<JQueryStatic> {
  if (jqueryPromise == null) {
    jqueryPromise = import("jquery").then((module) =>
      (module.default ?? module) as JQueryStatic,
    );
  }
  return jqueryPromise;
}

async function ensureBinaryTransport(jquery: JQueryStatic): Promise<void> {
  if (jqueryBinaryTransportPromise == null) {
    jqueryBinaryTransportPromise = (async () => {
      (globalThis as { $?: JQueryStatic; jQuery?: JQueryStatic }).$ = jquery;
      (globalThis as { $?: JQueryStatic; jQuery?: JQueryStatic }).jQuery =
        jquery;
      await import("jquery-binarytransport");
    })();
  }
  await jqueryBinaryTransportPromise;
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const $ = await getJQuery();
  await ensureBinaryTransport($);
  const result = await $.ajax({
    dataType: "binary",
    method: "GET",
    responseType: "arraybuffer",
    url,
  });
  return result;
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    body: compressed,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}
