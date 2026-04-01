import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDateLong, formatRelativeTime, formatTime } from "./date_format";

describe("日付操作ユーティリティ", () => {
  describe("formatDateLong — moment(x).locale('ja').format('LL') 相当", () => {
    it("「2025年1月15日」形式で出力される", () => {
      expect(formatDateLong("2025-01-15T00:00:00.000Z")).toBe("2025年1月15日");
    });

    it("月・日が1桁のとき0埋めされない", () => {
      expect(formatDateLong("2024-03-05T12:00:00.000Z")).toBe("2024年3月5日");
    });

    it("年末 UTC の日付がタイムゾーンに応じて正しく変換される", () => {
      const input = "2023-12-31T23:59:59.000Z";
      const expected = new Intl.DateTimeFormat("ja", { dateStyle: "long" }).format(new Date(input));
      expect(formatDateLong(input)).toBe(expected);
    });

    it("日付のみの文字列でも動作する", () => {
      expect(formatDateLong("2025-06-20")).toMatch(/2025年6月(19|20)日/);
    });
  });

  describe("formatTime — moment(x).locale('ja').format('HH:mm') 相当", () => {
    it("ローカルタイムの時:分で出力される", () => {
      const input = "2025-01-15T09:05:00+09:00";
      const expected = new Intl.DateTimeFormat("ja", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(input));
      expect(formatTime(input)).toBe(expected);
    });

    it("HH:mm 形式（コロン区切り数字）である", () => {
      expect(formatTime("2025-01-15T00:05:00.000Z")).toMatch(/^\d{1,2}:\d{2}$/);
    });

    it("深夜の時刻も正しくフォーマットされる", () => {
      const input = "2025-01-15T23:59:00+09:00";
      const expected = new Intl.DateTimeFormat("ja", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(input));
      expect(formatTime(input)).toBe(expected);
    });
  });

  describe("formatRelativeTime — moment(x).locale('ja').fromNow() 相当", () => {
    const FIXED_NOW = new Date("2025-06-01T12:00:00.000Z").getTime();

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("30秒前 → 「秒前」を含む", () => {
      const input = new Date(FIXED_NOW - 30 * 1000).toISOString();
      expect(formatRelativeTime(input)).toContain("秒前");
    });

    it("5分前 → 「5 分前」を含む", () => {
      const input = new Date(FIXED_NOW - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(input)).toContain("5 分前");
    });

    it("3時間前 → 「3 時間前」を含む", () => {
      const input = new Date(FIXED_NOW - 3 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(input)).toContain("3 時間前");
    });

    it("2日前 → 「2 日前」を含む", () => {
      const input = new Date(FIXED_NOW - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(input)).toContain("2 日前");
    });

    it("0秒前 → 「秒」を含む", () => {
      const input = new Date(FIXED_NOW).toISOString();
      expect(formatRelativeTime(input)).toContain("秒");
    });

    it("59分前は「分前」であり「時間」ではない", () => {
      const input = new Date(FIXED_NOW - 59 * 60 * 1000).toISOString();
      const result = formatRelativeTime(input);
      expect(result).toContain("分前");
      expect(result).not.toContain("時間");
    });

    it("60分前は「1 時間前」", () => {
      const input = new Date(FIXED_NOW - 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(input)).toContain("1 時間前");
    });

    it("23時間前は「時間前」であり「日」ではない", () => {
      const input = new Date(FIXED_NOW - 23 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(input);
      expect(result).toContain("時間前");
      expect(result).not.toContain("日");
    });

    it("24時間前は「1 日前」", () => {
      const input = new Date(FIXED_NOW - 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(input)).toContain("1 日前");
    });
  });

  describe("toISOString — moment(x).toISOString() 相当", () => {
    it("new Date(x).toISOString() が UTC の ISO 文字列を返す", () => {
      expect(new Date("2025-01-15T09:30:00.000Z").toISOString()).toBe("2025-01-15T09:30:00.000Z");
    });

    it("タイムゾーン付き入力でもUTCに正規化される", () => {
      expect(new Date("2025-01-15T18:30:00+09:00").toISOString()).toBe("2025-01-15T09:30:00.000Z");
    });
  });
});
