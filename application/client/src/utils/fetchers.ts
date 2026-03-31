// import { gzip } from "pako";

export interface FetcherHttpError {
  responseJSON?: unknown;
  status: number;
}

// async function gzipJSONBody(data: object): Promise<Uint8Array> {
//   const jsonString = JSON.stringify(data);
//   const uint8Array = new TextEncoder().encode(jsonString);

//   // Prefer native async compression to avoid blocking the main thread.
//   if (typeof CompressionStream !== "undefined") {
//     try {
//       const compressedBuffer = await new Response(
//         new Blob([uint8Array]).stream().pipeThrough(new CompressionStream("gzip")),
//       ).arrayBuffer();
//       return new Uint8Array(compressedBuffer);
//     } catch {
//       // Fall through to pako if native compression fails.
//     }
//   }

//   return gzip(uint8Array);
// }

function createFetcherHttpError(status: number, responseJSON?: unknown): FetcherHttpError {
  return {
    responseJSON,
    status,
  };
}

async function parseResponseJSON(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: "GET",
  });
  if (!response.ok) {
    const responseJSON = await parseResponseJSON(response);
    throw createFetcherHttpError(response.status, responseJSON);
  }

  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
  });
  const responseJSON = await parseResponseJSON(response);
  if (!response.ok) {
    throw createFetcherHttpError(response.status, responseJSON);
  }

  return responseJSON as T;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  const responseJSON = await parseResponseJSON(response);
  if (!response.ok) {
    throw createFetcherHttpError(response.status, responseJSON);
  }

  return responseJSON as T;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  // 非圧縮に
  // const compressed = await gzipJSONBody(data);
  // const body = compressed.buffer.slice(
  //   compressed.byteOffset,
  //   compressed.byteOffset + compressed.byteLength,
  // ) as ArrayBuffer;
  const body = JSON.stringify(data);

  const response = await fetch(url, {
    body,
    headers: {
      // "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const responseJSON = await parseResponseJSON(response);
  if (!response.ok) {
    throw createFetcherHttpError(response.status, responseJSON);
  }

  return responseJSON as T;
}
