import assert from "node:assert/strict";
import test from "node:test";

import { parseSearchQuery } from "./parse_search_query";

test("parseSearchQuery extracts the leading date from tokens with trailing characters", () => {
  const parsed = parseSearchQuery(
    "anime since:2026-01-060000000000x until:2026-01-060000x",
  );

  assert.equal(parsed.keywords, "anime");
  assert.equal(parsed.sinceDate?.toISOString(), "2026-01-06T00:00:00.000Z");
  assert.equal(parsed.untilDate?.toISOString(), "2026-01-06T23:59:59.999Z");
});
