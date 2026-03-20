import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { ApiClient } from "./api-helpers";
import { SuggestionsSchema } from "./schemas";

test.describe("GET /crok/suggestions", () => {
  test("SuggestionsSchema に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getCrokSuggestions();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(() => v.parse(SuggestionsSchema, body)).not.toThrow();
  });

  test("suggestions が 1 件以上", async ({ request }) => {
    const api = new ApiClient(request);
    const body = await (await api.getCrokSuggestions()).json();
    expect(body.suggestions.length).toBeGreaterThan(0);
  });
});
