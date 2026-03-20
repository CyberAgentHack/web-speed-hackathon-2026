const jaDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const jaTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const jaRelativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatJaDate(value: Date | string): string {
  return jaDateFormatter.format(toDate(value));
}

export function formatJaTime(value: Date | string): string {
  return jaTimeFormatter.format(toDate(value));
}

export function formatJaRelativeTime(value: Date | string, now: Date = new Date()): string {
  const target = toDate(value);
  const diffMs = target.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return jaRelativeTimeFormatter.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return jaRelativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return jaRelativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return jaRelativeTimeFormatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return jaRelativeTimeFormatter.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return jaRelativeTimeFormatter.format(diffYears, "year");
}

export function toIsoDateTime(value: Date | string): string {
  return toDate(value).toISOString();
}
