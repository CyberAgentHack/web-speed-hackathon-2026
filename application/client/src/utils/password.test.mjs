import assert from "node:assert/strict";
import test from "node:test";

import { hasPasswordSymbol } from "./password";

test("hasPasswordSymbol requires punctuation or symbol characters", () => {
  assert.equal(hasPasswordSymbol("testpass123"), false);
  assert.equal(hasPasswordSymbol("testpass-123"), true);
  assert.equal(hasPasswordSymbol("  testpass-123  "), true);
});
