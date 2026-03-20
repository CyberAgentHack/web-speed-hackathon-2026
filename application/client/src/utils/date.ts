const japaneseDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const japaneseTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const japaneseRelativeTimeFormatter = new Intl.RelativeTimeFormat("ja", {
  numeric: "always",
});

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function removeSpacing(value: string): string {
  return value.replace(/\s+/g, "");
}

export function toIsoDateTime(value: string | number | Date): string {
  return toDate(value).toISOString();
}

export function formatJapaneseDate(value: string | number | Date): string {
  return japaneseDateFormatter.format(toDate(value));
}

export function formatJapaneseTime(value: string | number | Date): string {
  return japaneseTimeFormatter.format(toDate(value));
}

export function formatRelativeTimeJa(
  value: string | number | Date,
  nowValue: string | number | Date = new Date(),
): string {
  const targetTime = toDate(value).getTime();
  const nowTime = toDate(nowValue).getTime();
  const diff = targetTime - nowTime;
  const absDiff = Math.abs(diff);

  if (absDiff < 45 * SECOND) {
    return diff < 0 ? "数秒前" : "数秒後";
  }

  if (absDiff < 90 * SECOND) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / MINUTE), "minute"));
  }

  if (absDiff < 45 * MINUTE) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / MINUTE), "minute"));
  }

  if (absDiff < 90 * MINUTE) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / HOUR), "hour"));
  }

  if (absDiff < 22 * HOUR) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / HOUR), "hour"));
  }

  if (absDiff < 36 * HOUR) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / DAY), "day"));
  }

  if (absDiff < 26 * DAY) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / DAY), "day"));
  }

  if (absDiff < 45 * DAY) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / MONTH), "month"));
  }

  if (absDiff < 320 * DAY) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / MONTH), "month"));
  }

  if (absDiff < 548 * DAY) {
    return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / YEAR), "year"));
  }

  return removeSpacing(japaneseRelativeTimeFormatter.format(Math.round(diff / YEAR), "year"));
}
