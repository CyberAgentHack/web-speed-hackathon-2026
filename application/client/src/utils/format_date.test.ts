import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { formatJaLongDate, formatRelativeTime, formatTime } from "./format_date";

describe("formatJaLongDate", () => {
  test("Date → 日本語ロング日付形式", () => {
    const result = formatJaLongDate(new Date("2024-01-15T00:00:00"));
    expect(result).toBe("2024年1月15日");
  });

  test("文字列の日付も受け付ける", () => {
    const result = formatJaLongDate("2024-12-25T12:00:00");
    expect(result).toBe("2024年12月25日");
  });
});

describe("formatTime", () => {
  test("Date → HH:mm 形式", () => {
    const result = formatTime(new Date("2024-01-15T14:30:00"));
    expect(result).toBe("14:30");
  });

  test("午前0時", () => {
    const result = formatTime(new Date("2024-01-15T00:05:00"));
    expect(result).toBe("00:05");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("数秒前 → '〜秒前'", () => {
    const result = formatRelativeTime(new Date("2024-06-15T11:59:30"));
    expect(result).toMatch(/30\s*秒前/);
  });

  test("数分前 → '〜分前'", () => {
    const result = formatRelativeTime(new Date("2024-06-15T11:55:00"));
    expect(result).toMatch(/5\s*分前/);
  });

  test("数時間前 → '〜時間前'", () => {
    const result = formatRelativeTime(new Date("2024-06-15T09:00:00"));
    expect(result).toMatch(/3\s*時間前/);
  });
});
