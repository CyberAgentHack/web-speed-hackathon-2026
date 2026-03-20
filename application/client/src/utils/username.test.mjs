import assert from "node:assert/strict";
import test from "node:test";

import { isValidUsername, normalizeUsernameInput } from "./username.ts";

test("normalizeUsernameInput trims surrounding spaces and a leading at-sign", () => {
  assert.equal(normalizeUsernameInput("  @test_user  "), "test_user");
});

test("isValidUsername only accepts letters, digits, and underscores", () => {
  assert.equal(isValidUsername("test_user"), true);
  assert.equal(isValidUsername("test-user"), false);
  assert.equal(isValidUsername("テスト"), false);
});
