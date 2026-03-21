import assert from "node:assert/strict";
import test from "node:test";

import { isValidDate, parseSearchQuery, sanitizeSearchText } from "./services";

test("parseSearchQuery keeps keywords around since/until filters", () => {
  assert.deepEqual(parseSearchQuery("foo since:2025-01-01 bar until:2025-01-31 baz"), {
    keywords: "foo bar baz",
    sinceDate: "2025-01-01",
    untilDate: "2025-01-31",
  });
});

test("parseSearchQuery captures invalid raw filter values for validation", () => {
  assert.deepEqual(parseSearchQuery("since:2025-02-30"), {
    keywords: "",
    sinceDate: "2025-02-30",
    untilDate: null,
  });
});

test("parseSearchQuery keeps the leading date even when extra characters follow it", () => {
  assert.deepEqual(parseSearchQuery("anime since:2026-01-060000000000x until:2026-01-0600x"), {
    keywords: "anime",
    sinceDate: "2026-01-06",
    untilDate: "2026-01-06",
  });
});

test("isValidDate rejects rollover dates", () => {
  assert.equal(isValidDate("2025-02-28"), true);
  assert.equal(isValidDate("2025-02-30"), false);
  assert.equal(isValidDate("2025-99-99"), false);
});

test("sanitizeSearchText normalizes from: to since:", () => {
  assert.equal(sanitizeSearchText("photo from 2025-01-01"), "photo since:2025-01-01");
});
