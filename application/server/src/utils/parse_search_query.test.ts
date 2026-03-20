import { describe, expect, test } from "bun:test";

import { parseSearchQuery } from "./parse_search_query";

describe("parseSearchQuery", () => {
  test("キーワードのみのクエリ → keywords に入る", () => {
    const result = parseSearchQuery("hello world");
    expect(result).toEqual({
      keywords: "hello world",
      sinceDate: null,
      untilDate: null,
    });
  });

  test("since:YYYY-MM-DD → sinceDate がその日の 00:00:00", () => {
    const result = parseSearchQuery("since:2024-03-15");
    expect(result.sinceDate).toBeInstanceOf(Date);
    expect(result.sinceDate!.getFullYear()).toBe(2024);
    expect(result.sinceDate!.getMonth()).toBe(2); // 0-indexed
    expect(result.sinceDate!.getDate()).toBe(15);
    expect(result.sinceDate!.getHours()).toBe(0);
    expect(result.sinceDate!.getMinutes()).toBe(0);
    expect(result.keywords).toBe("");
  });

  test("until:YYYY-MM-DD → untilDate がその日の 23:59:59", () => {
    const result = parseSearchQuery("until:2024-12-31");
    expect(result.untilDate).toBeInstanceOf(Date);
    expect(result.untilDate!.getFullYear()).toBe(2024);
    expect(result.untilDate!.getMonth()).toBe(11);
    expect(result.untilDate!.getDate()).toBe(31);
    expect(result.untilDate!.getHours()).toBe(23);
    expect(result.untilDate!.getMinutes()).toBe(59);
    expect(result.keywords).toBe("");
  });

  test("キーワード + since + until の混合 → 全て正しくパースされる", () => {
    const result = parseSearchQuery("太宰治 since:2024-01-01 until:2024-12-31");
    expect(result.keywords).toBe("太宰治");
    expect(result.sinceDate).not.toBeNull();
    expect(result.untilDate).not.toBeNull();
  });

  test("無効な日付 → null、キーワードからは除去される", () => {
    const result = parseSearchQuery("since:9999-99-99 hello");
    expect(result.sinceDate).toBeNull();
    expect(result.keywords).toBe("hello");
  });

  test("空文字列 → 全て空/null", () => {
    const result = parseSearchQuery("");
    expect(result).toEqual({ keywords: "", sinceDate: null, untilDate: null });
  });
});
