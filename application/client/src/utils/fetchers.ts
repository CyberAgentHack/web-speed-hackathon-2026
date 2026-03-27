type JQueryModule = typeof import("jquery");
type JQueryStatic = JQueryModule extends { default: infer T }
  ? T
  : JQueryModule;

type APIError = Error & {
  status: number;
  responseJSON?: unknown;
};

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
    throw await createAPIError(response);
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
    throw await createAPIError(response);
  }
  return response.json();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    throw await createAPIError(response);
  }
  return response.json();
}

async function createAPIError(response: Response): Promise<APIError> {
  let responseJSON: unknown;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    responseJSON = await response.json().catch(() => undefined);
  }

  const error = new Error(`HTTP Error: ${response.status}`) as APIError;
  error.status = response.status;
  error.responseJSON = responseJSON;
  return error;
}
