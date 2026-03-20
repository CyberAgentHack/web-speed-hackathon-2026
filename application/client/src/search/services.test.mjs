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

test("isValidDate rejects rollover dates", () => {
  assert.equal(isValidDate("2025-02-28"), true);
  assert.equal(isValidDate("2025-02-30"), false);
  assert.equal(isValidDate("2025-99-99"), false);
});

test("sanitizeSearchText normalizes from: to since:", () => {
  assert.equal(sanitizeSearchText("photo from 2025-01-01"), "photo since:2025-01-01");
});
