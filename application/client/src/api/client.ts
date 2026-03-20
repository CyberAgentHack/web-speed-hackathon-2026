import { hc } from "hono/client";

import type { ApiType } from "@web-speed-hackathon-2026/server/src/routes/api";

export const apiClient = hc<ApiType>("/api/v1");

export class HTTPError extends Error {
  responseJSON: unknown;
  constructor(status: number, responseJSON: unknown) {
    super(`HTTP ${status}`);
    this.responseJSON = responseJSON;
  }
}

export async function unwrap<T>(responsePromise: Promise<Response>): Promise<T> {
  const res = await responsePromise;
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new HTTPError(res.status, body);
  }
  return res.json() as Promise<T>;
}
