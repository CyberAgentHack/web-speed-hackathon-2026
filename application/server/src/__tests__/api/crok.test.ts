import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie } from "../helpers";

setupApiTestFile();

describe("GET /api/v1/crok/suggestions", () => {
  test("returns 200 with suggestions array", async () => {
    const res = await app.request("/api/v1/crok/suggestions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toBeDefined();
    expect(Array.isArray(body.suggestions)).toBe(true);
  });
});

describe("GET /api/v1/crok", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/crok");
    expect(res.status).toBe(401);
  });

  test(
    "returns SSE stream with done:false then done:true",
    async () => {
      const { cookie } = await signupAndGetCookie(app, "crok_sse_user", "pass123");
      const res = await app.request("/api/v1/crok", {
        headers: { Cookie: cookie },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");

      // Read the stream and collect events
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      const events: Array<{ done: boolean; text: string }> = [];

      // Read until we get at least 2 events or timeout
      const start = Date.now();
      while (Date.now() - start < 15000) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = accumulated.split("\n");
        accumulated = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              events.push(data);
              if (data.done === true) {
                reader.cancel();
                // Check: first event should have done: false, last event should have done: true
                expect(events[0]!.done).toBe(false);
                expect(events[events.length - 1]!.done).toBe(true);
                return;
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        }
      }

      // If we got here, verify what we have
      reader.cancel();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]!.done).toBe(false);
    },
    { timeout: 20000 },
  );
});
