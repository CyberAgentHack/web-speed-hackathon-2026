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

const japaneseRelativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatJapaneseDate(value: Date | string): string {
  return japaneseDateFormatter.format(toDate(value));
}

export function formatJapaneseTime(value: Date | string): string {
  return japaneseTimeFormatter.format(toDate(value));
}

export function toISOString(value: Date | string): string {
  return toDate(value).toISOString();
}

export function formatRelativeTimeFromNow(value: Date | string, now = new Date()): string {
  const diffMs = toDate(value).getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return japaneseRelativeTimeFormatter.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return japaneseRelativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return japaneseRelativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return japaneseRelativeTimeFormatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return japaneseRelativeTimeFormatter.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return japaneseRelativeTimeFormatter.format(diffYears, "year");
}
